// hooks/useFileOpener.ts

import { usePlayback } from "@/providers/PlaybackProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export const useFileOpener = () => {
  const router = useRouter();
  const { startDownloadedFilePlayback } = usePlayback();

  const openFile = useCallback(
    async (item: BaseItemDto) => {
      const directory = FileSystem.documentDirectory;

      if (!directory) {
        throw new Error("Document directory is not available");
      }

      if (!item.Id) {
        throw new Error("Item ID is not available");
      }

      try {
        const files = await FileSystem.readDirectoryAsync(directory);
        for (let f of files) {
          console.log(f);
        }
        const path = item.Id!;
        const matchingFile = files.find((file) => file.startsWith(path));

        if (!matchingFile) {
          throw new Error(`No file found for item ${path}`);
        }

        const url = `${directory}${matchingFile}`;

        console.log("Opening " + url);

        startDownloadedFilePlayback({
          item,
          url,
        });
        router.push("/play");
      } catch (error) {
        console.error("Error opening file:", error);
        // Handle the error appropriately, e.g., show an error message to the user
      }
    },
    [startDownloadedFilePlayback]
  );

  return { openFile };
};
