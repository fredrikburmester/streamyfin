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
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner-native";

export type ProcessItem = {
  id: string;
  item: Partial<BaseItemDto>;
  progress: number;
  size?: number;
  state: "optimizing" | "downloading" | "done" | "error" | "canceled";
};

const STORAGE_KEY = "runningProcess";

const DownloadContext = createContext<ReturnType<
  typeof useDownloadProvider
> | null>(null);

function useDownloadProvider() {
  const queryClient = useQueryClient();
  const [process, setProcess] = useState<ProcessItem | null>(null);
  const [settings] = useSettings();

  const {
    data: downloadedFiles,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["downloadedItems"],
    queryFn: getAllDownloadedItems,
    staleTime: 0,
  });

  useEffect(() => {
    // Load initial process state from AsyncStorage
    const loadInitialProcess = async () => {
      const storedProcess = await readProcess();
      setProcess(storedProcess);
    };
    loadInitialProcess();
  }, []);

  const clearProcess = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProcess(null);
  }, []);

  const updateProcess = useCallback(
    async (
      itemOrUpdater:
        | ProcessItem
        | null
        | ((prevState: ProcessItem | null) => ProcessItem | null)
    ) => {
      setProcess((prevProcess) => {
        let newState: ProcessItem | null;
        if (typeof itemOrUpdater === "function") {
          newState = itemOrUpdater(prevProcess);
        } else {
          newState = itemOrUpdater;
        }

        if (newState === null) {
          AsyncStorage.removeItem(STORAGE_KEY);
        } else {
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }

        return newState;
      });
    },
    []
  );

  const readProcess = useCallback(async (): Promise<ProcessItem | null> => {
    const item = await AsyncStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  }, []);

  const startDownload = useCallback(() => {
    if (!process?.item.Id) throw new Error("No item id");

    download({
      id: process.id,
      url: settings?.optimizedVersionsServerUrl + "download/" + process.id,
      destination: `${directories.documents}/${process?.item.Id}.mp4`,
    })
      .begin(() => {
        updateProcess((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            state: "downloading",
            progress: 50,
          } as ProcessItem;
        });
      })
      .progress((data) => {
        const percent = (data.bytesDownloaded / data.bytesTotal) * 100;
        updateProcess((prev) => {
          if (!prev) {
            console.warn("no prev");
            return null;
          }
          return {
            ...prev,
            state: "downloading",
            progress: percent,
          };
        });
      })
      .done(async () => {
        clearProcess();
        await saveDownloadedItemInfo(process.item);
        await queryClient.invalidateQueries({
          queryKey: ["downloadedItems"],
        });
        await refetch();
        completeHandler(process.id);
        toast.success(`Download completed for ${process.item.Name}`);
      })
      .error((error) => {
        updateProcess((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            state: "error",
          };
        });
        toast.error(`Download failed for ${process.item.Name}: ${error}`);
      });
  }, [queryClient, process?.id, settings?.optimizedVersionsServerUrl]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkJobStatusPeriodically = async () => {
      // console.log("checkJobStatusPeriodically ~");
      if (
        !process?.id ||
        !process.state ||
        !process.item.Id ||
        !settings?.optimizedVersionsServerUrl
      )
        return;
      if (process.state === "optimizing") {
        const job = await checkJobStatus(
          process.id,
          settings?.optimizedVersionsServerUrl
        );

        if (!job) {
          clearProcess();
          return;
        }

        // console.log("Job ~", job);

        // Update the local process state with the state from the server.
        let newState: ProcessItem["state"] = "optimizing";
        if (job.status === "completed") {
          if (intervalId) clearInterval(intervalId);
          startDownload();
          return;
        } else if (job.status === "failed") {
          newState = "error";
        } else if (job.status === "cancelled") {
          newState = "canceled";
        }

        updateProcess((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            state: newState,
            progress: job.progress,
          };
        });
      } else if (process.state === "downloading") {
        // Don't do anything, it's downloading locally
        return;
      } else if (["done", "canceled", "error"].includes(process.state)) {
        console.log("Job is done or failed or canceled");
        clearProcess();
        if (intervalId) clearInterval(intervalId);
      }
    };

    console.log("Starting interval check");

    // Start checking immediately
    checkJobStatusPeriodically();

    // Then check every 2 seconds
    intervalId = setInterval(checkJobStatusPeriodically, 2000);

    // Clean up function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [process?.id, settings?.optimizedVersionsServerUrl]);

  const startBackgroundDownload = useCallback(
    async (url: string, item: BaseItemDto) => {
      try {
        const response = await axios.post(
          settings?.optimizedVersionsServerUrl + "optimize-version",
          { url },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status !== 201) {
          throw new Error("Failed to start optimization job");
        }

        const { id } = response.data;

        updateProcess({
          id,
          item: item,
          progress: 0,
          state: "optimizing",
        });

        toast.success(`Optimization job started for ${item.Name}`);
      } catch (error) {
        console.error("Error in startBackgroundDownload:", error);
        toast.error(`Failed to start download for ${item.Name}`);
      }
    },
    [settings?.optimizedVersionsServerUrl]
  );

  /**
   * Deletes all downloaded files and clears the download record.
   */
  const deleteAllFiles = async (): Promise<void> => {
    try {
      // Get the base directory
      const baseDirectory = FileSystem.documentDirectory;

      if (!baseDirectory) {
        throw new Error("Base directory not found");
      }

      // Read the contents of the base directory
      const dirContents = await FileSystem.readDirectoryAsync(baseDirectory);

      // Delete each item in the directory
      for (const item of dirContents) {
        const itemPath = `${baseDirectory}${item}`;
        const itemInfo = await FileSystem.getInfoAsync(itemPath);

        if (itemInfo.exists) {
          await FileSystem.deleteAsync(itemPath, { idempotent: true });
        }
      }
      // Clear the downloadedItems in AsyncStorage
      await AsyncStorage.removeItem("downloadedItems");
      await AsyncStorage.removeItem("runningProcess");
      clearProcess();

      // Invalidate the query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["downloadedItems"] });

      console.log(
        "Successfully deleted all files and folders in the directory and cleared AsyncStorage"
      );
    } catch (error) {
      console.error("Failed to delete all files and folders:", error);
    }
  };

  /**
   * Deletes a specific file and updates the download record.
   * @param id - The ID of the file to delete.
   */
  const deleteFile = async (id: string): Promise<void> => {
    if (!id) {
      console.error("Invalid file ID");
      return;
    }

    try {
      // Get the directory path
      const directory = FileSystem.documentDirectory;

      if (!directory) {
        console.error("Document directory not found");
        return;
      }
      // Read the contents of the directory
      const dirContents = await FileSystem.readDirectoryAsync(directory);

      // Find and delete the file with the matching ID (without extension)
      for (const item of dirContents) {
        const itemNameWithoutExtension = item.split(".")[0];
        if (itemNameWithoutExtension === id) {
          const filePath = `${directory}${item}`;
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          console.log(`Successfully deleted file: ${item}`);
          break;
        }
      }

      // Remove the item from AsyncStorage
      const downloadedItems = await AsyncStorage.getItem("downloadedItems");
      if (downloadedItems) {
        let items = JSON.parse(downloadedItems);
        items = items.filter((item: any) => item.Id !== id);
        await AsyncStorage.setItem("downloadedItems", JSON.stringify(items));
      }

      // Invalidate the query to refresh the UI
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

  /**
   * Retrieves the list of downloaded files from AsyncStorage.
   * @returns An array of BaseItemDto objects representing downloaded files.
   */
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
    } catch (error) {
      console.error("Failed to save downloaded item information:", error);
    }
  }

  return {
    process,
    updateProcess,
    startBackgroundDownload,
    clearProcess,
    readProcess,
    downloadedFiles,
    deleteAllFiles,
    deleteFile,
    saveDownloadedItemInfo,
  };
}

// Create the provider component
export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const downloadProviderValue = useDownloadProvider();
  const queryClient = new QueryClient();

  return (
    <DownloadContext.Provider value={downloadProviderValue}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DownloadContext.Provider>
  );
}

// Create a custom hook to use the download context
export function useDownload() {
  const context = useContext(DownloadContext);
  if (context === null) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
}

const checkJobStatus = async (
  id: string,
  baseUrl: string
): Promise<{
  progress: number;
  status: "running" | "completed" | "failed" | "cancelled";
}> => {
  const statusResponse = await axios.get(`${baseUrl}job-status/${id}`);

  if (statusResponse.status !== 200) {
    throw new Error("Failed to fetch job status");
  }

  const json = statusResponse.data;
  return json;
};
