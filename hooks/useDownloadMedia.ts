import { useCallback, useRef, useState } from "react";
import { useAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Api } from "@jellyfin/sdk";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { runningProcesses } from "@/utils/atoms/downloads";

/**
 * Custom hook for downloading media using the Jellyfin API.
 *
 * @param api - The Jellyfin API instance
 * @param userId - The user ID
 * @returns An object with download-related functions and state
 */
export const useDownloadMedia = (api: Api | null, userId?: string | null) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_, setProgress] = useAtom(runningProcesses);
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(
    null,
  );

  const downloadMedia = useCallback(
    async (item: BaseItemDto | null): Promise<boolean> => {
      if (!item?.Id || !api || !userId) {
        setError("Invalid item or API");
        return false;
      }

      setIsDownloading(true);
      setError(null);
      setProgress({ item, progress: 0 });

      try {
        const filename = item.Id;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        const url = `${api.basePath}/Items/${item.Id}/File`;

        downloadResumableRef.current = FileSystem.createDownloadResumable(
          url,
          fileUri,
          {
            headers: {
              Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
            },
          },
          (downloadProgress) => {
            const currentProgress =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            setProgress({ item, progress: currentProgress * 100 });
          },
        );

        const res = await downloadResumableRef.current.downloadAsync();

        if (!res?.uri) {
          throw new Error("Download failed: No URI returned");
        }

        await updateDownloadedFiles(item);

        setIsDownloading(false);
        setProgress(null);
        return true;
      } catch (error) {
        console.error("Error downloading media:", error);
        setError("Failed to download media");
        setIsDownloading(false);
        setProgress(null);
        return false;
      }
    },
    [api, userId, setProgress],
  );

  const cancelDownload = useCallback(async (): Promise<void> => {
    if (!downloadResumableRef.current) return;

    try {
      await downloadResumableRef.current.pauseAsync();
      setIsDownloading(false);
      setError("Download cancelled");
      setProgress(null);
      downloadResumableRef.current = null;
    } catch (error) {
      console.error("Error cancelling download:", error);
      setError("Failed to cancel download");
    }
  }, [setProgress]);

  return { downloadMedia, isDownloading, error, cancelDownload };
};

/**
 * Updates the list of downloaded files in AsyncStorage.
 *
 * @param item - The item to add to the downloaded files list
 */
async function updateDownloadedFiles(item: BaseItemDto): Promise<void> {
  try {
    const currentFiles: BaseItemDto[] = JSON.parse(
      (await AsyncStorage.getItem("downloaded_files")) ?? "[]",
    );
    const updatedFiles = [
      ...currentFiles.filter((file) => file.Id !== item.Id),
      item,
    ];
    await AsyncStorage.setItem(
      "downloaded_files",
      JSON.stringify(updatedFiles),
    );
  } catch (error) {
    console.error("Error updating downloaded files:", error);
  }
}
