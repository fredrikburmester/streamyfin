import { useSettings } from "@/utils/atoms/settings";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  completeHandler,
  directories,
  download,
} from "@kesha-antonov/react-native-background-downloader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner-native";
import { apiAtom } from "./JellyfinProvider";

export type ProcessItem = {
  id: string;
  item: Partial<BaseItemDto>;
  progress: number;
  size?: number;
  speed?: number;
  state:
    | "optimizing"
    | "downloading"
    | "done"
    | "error"
    | "canceled"
    | "queued";
};

const STORAGE_KEY = "runningProcesses";

const DownloadContext = createContext<ReturnType<
  typeof useDownloadProvider
> | null>(null);

function useDownloadProvider() {
  const queryClient = useQueryClient();
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [settings] = useSettings();
  const router = useRouter();
  const [api] = useAtom(apiAtom);

  const authHeader = useMemo(() => {
    return api?.accessToken;
  }, [api]);

  const { data: downloadedFiles, refetch } = useQuery({
    queryKey: ["downloadedItems"],
    queryFn: getAllDownloadedItems,
    staleTime: 0,
  });

  useEffect(() => {
    // Load initial processes state from AsyncStorage
    const loadInitialProcesses = async () => {
      const storedProcesses = await readProcesses();
      setProcesses(storedProcesses);
    };
    loadInitialProcesses();
  }, []);

  const clearProcesses = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProcesses([]);
  }, []);

  const updateProcess = useCallback(
    async (id: string, updater: Partial<ProcessItem>) => {
      setProcesses((prevProcesses) => {
        const newProcesses = prevProcesses.map((process) =>
          process.id === id ? { ...process, ...updater } : process
        );

        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProcesses));

        return newProcesses;
      });
    },
    []
  );

  const addProcess = useCallback(async (item: ProcessItem) => {
    setProcesses((prevProcesses) => {
      const newProcesses = [...prevProcesses, item];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProcesses));
      return newProcesses;
    });
  }, []);

  const removeProcess = useCallback(async (id: string) => {
    setProcesses((prevProcesses) => {
      const newProcesses = prevProcesses.filter((process) => process.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProcesses));
      return newProcesses;
    });
  }, []);

  const readProcesses = useCallback(async (): Promise<ProcessItem[]> => {
    const items = await AsyncStorage.getItem(STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  }, []);

  const startDownload = useCallback(
    (process: ProcessItem) => {
      if (!process?.item.Id || !authHeader) throw new Error("No item id");

      download({
        id: process.id,
        url: settings?.optimizedVersionsServerUrl + "download/" + process.id,
        destination: `${directories.documents}/${process?.item.Id}.mp4`,
        headers: {
          Authorization: authHeader,
        },
      })
        .begin(() => {
          toast.info(`Download started for ${process.item.Name}`);
          updateProcess(process.id, { state: "downloading" });
        })
        .progress((data) => {
          const percent = (data.bytesDownloaded / data.bytesTotal) * 100;
          updateProcess(process.id, {
            state: "downloading",
            progress: percent,
          });
        })
        .done(async () => {
          removeProcess(process.id);
          await saveDownloadedItemInfo(process.item);
          await queryClient.invalidateQueries({
            queryKey: ["downloadedItems"],
          });
          await refetch();
          completeHandler(process.id);
          toast.success(`Download completed for ${process.item.Name}`);
        })
        .error((error) => {
          updateProcess(process.id, { state: "error" });
          toast.error(`Download failed for ${process.item.Name}: ${error}`);
        });
    },
    [queryClient, settings?.optimizedVersionsServerUrl, authHeader]
  );

  useEffect(() => {
    const checkJobStatusPeriodically = async () => {
      if (!settings?.optimizedVersionsServerUrl || !authHeader) return;

      const updatedProcesses = await Promise.all(
        processes.map(async (process) => {
          if (!settings.optimizedVersionsServerUrl) return process;
          if (process.state === "queued" || process.state === "optimizing") {
            try {
              const job = await checkJobStatus(
                process.id,
                settings.optimizedVersionsServerUrl,
                authHeader
              );

              if (!job) {
                return process;
              }

              let newState: ProcessItem["state"] = process.state;
              if (job.status === "queued") {
                newState = "queued";
              } else if (job.status === "running") {
                newState = "optimizing";
              } else if (job.status === "completed") {
                startDownload(process);
                return {
                  ...process,
                  progress: 100,
                  speed: 0,
                };
              } else if (job.status === "failed") {
                newState = "error";
              } else if (job.status === "cancelled") {
                newState = "canceled";
              }

              return {
                ...process,
                state: newState,
                progress: job.progress,
                speed: job.speed,
              };
            } catch (error) {
              if (axios.isAxiosError(error) && !error.response) {
                // Network error occurred (server might be down)
                console.error("Network error occurred:", error.message);
                toast.error(
                  "Network error: Unable to connect to optimization server"
                );
                return {
                  ...process,
                  state: "error",
                  errorMessage:
                    "Network error: Unable to connect to optimization server",
                };
              } else {
                // Other types of errors
                console.error("Error checking job status:", error);
                toast.error(
                  "An unexpected error occurred while checking job status"
                );
                return {
                  ...process,
                  state: "error",
                  errorMessage: "An unexpected error occurred",
                };
              }
            }
          }
          return process;
        })
      );

      // Filter out null values (completed jobs)
      const filteredProcesses = updatedProcesses.filter(
        (process) => process !== null
      ) as ProcessItem[];

      // Update the state with the filtered processes
      setProcesses(filteredProcesses);
    };

    const intervalId = setInterval(checkJobStatusPeriodically, 2000);

    return () => clearInterval(intervalId);
  }, [
    processes,
    settings?.optimizedVersionsServerUrl,
    authHeader,
    startDownload,
  ]);

  const startBackgroundDownload = useCallback(
    async (url: string, item: BaseItemDto) => {
      try {
        const response = await axios.post(
          settings?.optimizedVersionsServerUrl + "optimize-version",
          { url },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
          }
        );

        if (response.status !== 201) {
          throw new Error("Failed to start optimization job");
        }

        const { id } = response.data;

        addProcess({
          id,
          item: item,
          progress: 0,
          state: "queued",
        });

        toast.success(`Queued ${item.Name} for optimization`, {
          action: {
            label: "Go to download",
            onClick: () => {
              router.push("/downloads");
              toast.dismiss();
            },
          },
        });
      } catch (error) {
        console.error("Error in startBackgroundDownload:", error);
        if (axios.isAxiosError(error)) {
          console.error("Axios error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
          });
          toast.error(
            `Failed to start download for ${item.Name}: ${error.message}`
          );
          if (error.response) {
            toast.error(
              `Server responded with status ${error.response.status}`
            );
          } else if (error.request) {
            toast.error("No response received from server");
          } else {
            toast.error("Error setting up the request");
          }
        } else {
          console.error("Non-Axios error:", error);
          toast.error(
            `Failed to start download for ${item.Name}: Unexpected error`
          );
        }
      }
    },
    [settings?.optimizedVersionsServerUrl, authHeader]
  );

  const deleteAllFiles = async (): Promise<void> => {
    try {
      const baseDirectory = FileSystem.documentDirectory;

      if (!baseDirectory) {
        throw new Error("Base directory not found");
      }

      const dirContents = await FileSystem.readDirectoryAsync(baseDirectory);

      for (const item of dirContents) {
        const itemPath = `${baseDirectory}${item}`;
        const itemInfo = await FileSystem.getInfoAsync(itemPath);

        if (itemInfo.exists) {
          await FileSystem.deleteAsync(itemPath, { idempotent: true });
        }
      }
      await AsyncStorage.removeItem("downloadedItems");
      await AsyncStorage.removeItem("runningProcesses");
      clearProcesses();

      queryClient.invalidateQueries({ queryKey: ["downloadedItems"] });

      console.log(
        "Successfully deleted all files and folders in the directory and cleared AsyncStorage"
      );
    } catch (error) {
      console.error("Failed to delete all files and folders:", error);
    }
  };

  const deleteFile = async (id: string): Promise<void> => {
    if (!id) {
      console.error("Invalid file ID");
      return;
    }

    try {
      const directory = FileSystem.documentDirectory;

      if (!directory) {
        console.error("Document directory not found");
        return;
      }
      const dirContents = await FileSystem.readDirectoryAsync(directory);

      for (const item of dirContents) {
        const itemNameWithoutExtension = item.split(".")[0];
        if (itemNameWithoutExtension === id) {
          const filePath = `${directory}${item}`;
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          console.log(`Successfully deleted file: ${item}`);
          break;
        }
      }

      const downloadedItems = await AsyncStorage.getItem("downloadedItems");
      if (downloadedItems) {
        let items = JSON.parse(downloadedItems);
        items = items.filter((item: any) => item.Id !== id);
        await AsyncStorage.setItem("downloadedItems", JSON.stringify(items));
      }

      queryClient.invalidateQueries({ queryKey: ["downloadedItems"] });

      console.log(
        `Successfully deleted file and AsyncStorage entry for ID ${id}`
      );
    } catch (error) {
      console.error(
        `Failed to delete file and AsyncStorage entry for ID ${id}:`,
        error
      );
    }
  };

  async function getAllDownloadedItems(): Promise<BaseItemDto[]> {
    try {
      const downloadedItems = await AsyncStorage.getItem("downloadedItems");
      if (downloadedItems) {
        return JSON.parse(downloadedItems) as BaseItemDto[];
      } else {
        return [];
      }
    } catch (error) {
      console.error("Failed to retrieve downloaded items:", error);
      return [];
    }
  }

  async function saveDownloadedItemInfo(item: BaseItemDto) {
    try {
      const downloadedItems = await AsyncStorage.getItem("downloadedItems");
      let items: BaseItemDto[] = downloadedItems
        ? JSON.parse(downloadedItems)
        : [];

      const existingItemIndex = items.findIndex((i) => i.Id === item.Id);
      if (existingItemIndex !== -1) {
        items[existingItemIndex] = item;
      } else {
        items.push(item);
      }

      await AsyncStorage.setItem("downloadedItems", JSON.stringify(items));
      await queryClient.invalidateQueries({ queryKey: ["downloadedItems"] });
      refetch();
    } catch (error) {
      console.error("Failed to save downloaded item information:", error);
    }
  }

  return {
    processes,
    updateProcess,
    startBackgroundDownload,
    clearProcesses,
    readProcesses,
    downloadedFiles,
    deleteAllFiles,
    deleteFile,
    saveDownloadedItemInfo,
    addProcess,
    removeProcess,
  };
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const downloadProviderValue = useDownloadProvider();
  const queryClient = new QueryClient();

  return (
    <DownloadContext.Provider value={downloadProviderValue}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (context === null) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
}

const checkJobStatus = async (
  id: string,
  baseUrl: string,
  authHeader: string
): Promise<{
  progress: number;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  speed?: string;
}> => {
  const statusResponse = await axios.get(`${baseUrl}job-status/${id}`, {
    headers: {
      Authorization: authHeader,
    },
  });
  if (statusResponse.status !== 200) {
    throw new Error("Failed to fetch job status");
  }

  const json = statusResponse.data;
  return json;
};
