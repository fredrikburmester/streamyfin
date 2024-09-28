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
      const url = `${directory}/${item.Id}.mp4`;

      startDownloadedFilePlayback({
        item,
        url,
      });
      router.push("/play");
    },
    [startDownloadedFilePlayback]
  );

  return { openFile };
};
