import { useSettings } from "@/utils/atoms/settings";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  checkForExistingDownloads,
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
  useRef,
  useState,
} from "react";
import { toast } from "sonner-native";
import { apiAtom } from "./JellyfinProvider";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { writeToLog } from "@/utils/log";
import { getOrSetDeviceId } from "@/utils/device";
import {
  cancelAllJobs,
  cancelJobById,
  getAllJobsByDeviceId,
  JobStatus,
} from "@/utils/optimize-server";

export const BACKGROUND_FETCH_TASK = "background-fetch";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = Date.now();

  console.log(
    `Got background fetch call at date: ${new Date(now).toISOString()}`
  );

  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

const STORAGE_KEY = "runningProcesses";

export async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 1 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

export async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}

const DownloadContext = createContext<ReturnType<
  typeof useDownloadProvider
> | null>(null);

function useDownloadProvider() {
  const queryClient = useQueryClient();
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

  const [processes, setProcesses] = useState<JobStatus[]>([]);

  useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const deviceId = await getOrSetDeviceId();
      const url = settings?.optimizedVersionsServerUrl;

      if (
        settings?.downloadMethod !== "optimized" ||
        !url ||
        !deviceId ||
        !authHeader
      )
        return [];

      const jobs = await getAllJobsByDeviceId({
        deviceId,
        authHeader,
        url,
      });

      setProcesses(jobs);

      return jobs;
    },
    staleTime: 0,
    refetchInterval: 1000 * 3, // 5 minutes
    enabled: settings?.downloadMethod === "optimized",
  });

  useEffect(() => {
    const checkIfShouldStartDownload = async () => {
      if (!processes) return;
      for (let i = 0; i < processes.length; i++) {
        const job = processes[i];

        // Check if the download is already in progress
        const tasks = await checkForExistingDownloads();
        if (tasks.find((task) => task.id === job.id)) continue;

        if (job.status === "completed") {
          await startDownload(job);
          continue;
        }
      }
    };

    checkIfShouldStartDownload();
  }, [processes]);

  /********************
   * Background task
   *******************/
  // useEffect(() => {
  //   // Check background task status
  //   checkStatusAsync();
  // }, []);

  // const [isRegistered, setIsRegistered] = useState(false);
  // const [status, setStatus] =
  //   useState<BackgroundFetch.BackgroundFetchStatus | null>(null);

  // const checkStatusAsync = async () => {
  //   const status = await BackgroundFetch.getStatusAsync();
  //   const isRegistered = await TaskManager.isTaskRegisteredAsync(
  //     BACKGROUND_FETCH_TASK
  //   );
  //   setStatus(status);
  //   setIsRegistered(isRegistered);

  //   console.log("Background fetch status:", status);
  //   console.log("Background fetch task registered:", isRegistered);
  // };

  // const toggleFetchTask = async () => {
  //   if (isRegistered) {
  //     console.log("Unregistering background fetch task");
  //     await unregisterBackgroundFetchAsync();
  //   } else {
  //     console.log("Registering background fetch task");
  //     await registerBackgroundFetchAsync();
  //   }

  //   checkStatusAsync();
  // };
  /**********************
   **********************
   *********************/

  const removeProcess = useCallback(
    async (id: string) => {
      const deviceId = await getOrSetDeviceId();
      if (!deviceId || !authHeader || !settings?.optimizedVersionsServerUrl)
        return;

      try {
        await cancelJobById({
          authHeader,
          id,
          url: settings?.optimizedVersionsServerUrl,
        });
      } catch (error) {
        console.log(error);
      }
    },
    [settings?.optimizedVersionsServerUrl, authHeader]
  );

  const startDownload = useCallback(
    async (process: JobStatus) => {
      if (!process?.item.Id || !authHeader) throw new Error("No item id");

      download({
        id: process.id,
        url: settings?.optimizedVersionsServerUrl + "download/" + process.id,
        destination: `${directories.documents}/${process.item.Id}.mp4`,
        headers: {
          Authorization: authHeader,
        },
      })
        .begin(() => {
          toast.info(`Download started for ${process.item.Name}`);
        })
        .progress((data) => {
          const percent = (data.bytesDownloaded / data.bytesTotal) * 100;
          console.log("Progress ~", percent);
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
          toast.error(`Download failed for ${process.item.Name}: ${error}`);
          writeToLog("ERROR", `Download failed for ${process.item.Name}`, {
            error,
          });
        });
    },
    [queryClient, settings?.optimizedVersionsServerUrl, authHeader]
  );

  const startBackgroundDownload = useCallback(
    async (url: string, item: BaseItemDto, fileExtension: string) => {
      try {
        const deviceId = await getOrSetDeviceId();
        const response = await axios.post(
          settings?.optimizedVersionsServerUrl + "optimize-version",
          { url, fileExtension, deviceId, itemId: item.Id, item },
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

      if (!authHeader) throw new Error("No auth header");
      if (!settings?.optimizedVersionsServerUrl)
        throw new Error("No server url");
      cancelAllJobs({
        authHeader,
        url: settings?.optimizedVersionsServerUrl,
        deviceId: await getOrSetDeviceId(),
      });

      queryClient.invalidateQueries({ queryKey: ["downloadedItems"] });

      toast.success("All files and folders deleted successfully");
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
    startBackgroundDownload,
    downloadedFiles,
    deleteAllFiles,
    deleteFile,
    saveDownloadedItemInfo,
    removeProcess,
    setProcesses,
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
