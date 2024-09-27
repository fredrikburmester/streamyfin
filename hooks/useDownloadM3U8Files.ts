import { apiAtom } from "@/providers/JellyfinProvider";
import { runningProcesses } from "@/utils/atoms/downloads";
import { writeToLog } from "@/utils/log";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { download } from "@kesha-antonov/react-native-background-downloader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { toast } from "sonner-native";

export const useDownloadM3U8Files = (item: BaseItemDto) => {
  const [_, setProgress] = useAtom(runningProcesses);
  const queryClient = useQueryClient();
  const [api] = useAtom(apiAtom);

  if (!item.Id || !item.Name) {
    throw new Error("Item must have an Id and Name");
  }

  const startBackgroundDownload = useCallback(
    async (url: string) => {
      if (!api) {
        throw new Error("API is not defined");
      }

      toast.success("Download started", { invert: true });
      writeToLog("INFO", `Starting download for item ${item.Name}`);

      try {
        const directoryPath = `${FileSystem.documentDirectory}${item.Id}`;
        await FileSystem.makeDirectoryAsync(directoryPath, {
          intermediates: true,
        });

        const m3u8Content = await FileSystem.downloadAsync(
          url,
          `${directoryPath}/original.m3u8`
        );

        if (m3u8Content.status !== 200) {
          throw new Error("Failed to download m3u8 file");
        }

        const m3u8Text = await FileSystem.readAsStringAsync(m3u8Content.uri);
        const segments = await fetchSegmentInfo(
          m3u8Text,
          api.basePath,
          item.Id!
        );

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const segmentUrl = `${api.basePath}/videos/${item.Id}/${segment.path}`;
          const destination = `${directoryPath}/${i}.ts`;

          await download({
            id: `${item.Id}_segment_${i}`,
            url: segmentUrl,
            destination: destination,
          }).done((e) => {
            console.log("Download completed for segment", i);
          });
        }

        await createLocalM3U8File(segments, directoryPath);
        await saveDownloadedItemInfo(item);

        writeToLog("INFO", `Download completed for item: ${item.Name}`);
        await queryClient.invalidateQueries({ queryKey: ["downloaded_files"] });
        await queryClient.invalidateQueries({ queryKey: ["downloaded"] });
      } catch (error) {
        console.error("Failed to download:", error);
        writeToLog("ERROR", `Download failed for item: ${item.Name}`);
        setProgress(null);
        throw error;
      }
    },
    [item, setProgress, queryClient, api]
  );

  return { startBackgroundDownload };
};

interface Segment {
  duration: number;
  path: string;
}

async function fetchSegmentInfo(
  masterM3U8Content: string,
  baseUrl: string,
  itemId: string
): Promise<Segment[]> {
  const lines = masterM3U8Content.split("\n");
  const mainPlaylistLine = lines.find((line) => line.startsWith("main.m3u8"));

  if (!mainPlaylistLine) {
    throw new Error("Main playlist URL not found in the master M3U8");
  }

  const url = `${baseUrl}/videos/${itemId}/${mainPlaylistLine}`;
  const response = await fetch(url);
  const mainPlaylistContent = await response.text();

  const segments: Segment[] = [];
  const mainPlaylistLines = mainPlaylistContent.split("\n");

  for (let i = 0; i < mainPlaylistLines.length; i++) {
    if (mainPlaylistLines[i].startsWith("#EXTINF:")) {
      const durationMatch = mainPlaylistLines[i].match(
        /#EXTINF:(\d+(?:\.\d+)?)/
      );
      const duration = durationMatch ? parseFloat(durationMatch[1]) : 0;
      const path = mainPlaylistLines[i + 1];

      if (path) {
        segments.push({ duration, path });
      }

      i++;
    }
  }

  return segments;
}

async function createLocalM3U8File(segments: Segment[], directoryPath: string) {
  let localM3U8Content = "#EXTM3U\n#EXT-X-VERSION:3\n";
  localM3U8Content += `#EXT-X-TARGETDURATION:${Math.ceil(
    Math.max(...segments.map((s) => s.duration))
  )}\n`;
  localM3U8Content += "#EXT-X-MEDIA-SEQUENCE:0\n";

  segments.forEach((segment, index) => {
    localM3U8Content += `#EXTINF:${segment.duration.toFixed(3)},\n`;
    localM3U8Content += `${directoryPath}/${index}.ts\n`;
  });

  localM3U8Content += "#EXT-X-ENDLIST\n";

  const localM3U8Path = `${directoryPath}/local.m3u8`;
  await FileSystem.writeAsStringAsync(localM3U8Path, localM3U8Content);
}

export async function saveDownloadedItemInfo(item: BaseItemDto) {
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

export async function deleteDownloadedItem(itemId: string) {
  try {
    const downloadedItems = await AsyncStorage.getItem("downloadedItems");
    let items: BaseItemDto[] = downloadedItems
      ? JSON.parse(downloadedItems)
      : [];
    items = items.filter((item) => item.Id !== itemId);
    await AsyncStorage.setItem("downloadedItems", JSON.stringify(items));

    const directoryPath = `${FileSystem.documentDirectory}${itemId}`;
    await FileSystem.deleteAsync(directoryPath, { idempotent: true });
  } catch (error) {
    console.error("Failed to delete downloaded item:", error);
  }
}

export async function getAllDownloadedItems(): Promise<BaseItemDto[]> {
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
