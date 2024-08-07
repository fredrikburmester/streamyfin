import { useCallback } from "react";
import { useAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { FFmpegKit, FFmpegKitConfig } from "ffmpeg-kit-react-native";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { runningProcesses } from "@/utils/atoms/downloads";
import { writeToLog } from "@/utils/log";

/**
 * Custom hook for remuxing HLS to MP4 using FFmpeg.
 *
 * @param url - The URL of the HLS stream
 * @param item - The BaseItemDto object representing the media item
 * @returns An object with remuxing-related functions
 */
export const useRemuxHlsToMp4 = (url: string, item: BaseItemDto) => {
  const [_, setProgress] = useAtom(runningProcesses);

  if (!item.Id || !item.Name) {
    writeToLog("ERROR", "useRemuxHlsToMp4 ~ missing arguments");
    throw new Error("Item must have an Id and Name");
  }

  const output = `${FileSystem.documentDirectory}${item.Id}.mp4`;
  const command = `-y -fflags +genpts -i ${url} -c copy -bufsize 10M -max_muxing_queue_size 4096 ${output}`;

  const startRemuxing = useCallback(async () => {
    writeToLog(
      "INFO",
      `useRemuxHlsToMp4 ~ startRemuxing for item ${item.Name}`,
    );

    try {
      setProgress({ item, progress: 0, startTime: new Date(), speed: 0 });

      FFmpegKitConfig.enableStatisticsCallback((statistics) => {
        const videoLength =
          (item.MediaSources?.[0]?.RunTimeTicks || 0) / 10000000; // In seconds
        const fps = item.MediaStreams?.[0]?.RealFrameRate || 25;
        const totalFrames = videoLength * fps;
        const processedFrames = statistics.getVideoFrameNumber();
        const speed = statistics.getSpeed();

        const percentage =
          totalFrames > 0
            ? Math.floor((processedFrames / totalFrames) * 100)
            : 0;

        setProgress((prev) =>
          prev?.item.Id === item.Id!
            ? { ...prev, progress: percentage, speed }
            : prev,
        );
      });

      await FFmpegKit.executeAsync(command, async (session) => {
        const returnCode = await session.getReturnCode();

        if (returnCode.isValueSuccess()) {
          await updateDownloadedFiles(item);
          writeToLog(
            "INFO",
            `useRemuxHlsToMp4 ~ remuxing completed successfully for item: ${item.Name}`,
          );
        } else if (returnCode.isValueError()) {
          writeToLog(
            "ERROR",
            `useRemuxHlsToMp4 ~ remuxing failed for item: ${item.Name}`,
          );
        } else if (returnCode.isValueCancel()) {
          writeToLog(
            "INFO",
            `useRemuxHlsToMp4 ~ remuxing was canceled for item: ${item.Name}`,
          );
        }

        setProgress(null);
      });
    } catch (error) {
      console.error("Failed to remux:", error);
      writeToLog(
        "ERROR",
        `useRemuxHlsToMp4 ~ remuxing failed for item: ${item.Name}`,
      );
      setProgress(null);
    }
  }, [output, item, command, setProgress]);

  const cancelRemuxing = useCallback(() => {
    FFmpegKit.cancel();
    setProgress(null);
    writeToLog(
      "INFO",
      `useRemuxHlsToMp4 ~ remuxing cancelled for item: ${item.Name}`,
    );
  }, [item.Name, setProgress]);

  return { startRemuxing, cancelRemuxing };
};

/**
 * Updates the list of downloaded files in AsyncStorage.
 *
 * @param item - The item to add to the downloaded files list
 */
async function updateDownloadedFiles(item: BaseItemDto): Promise<void> {
  try {
    const currentFiles: BaseItemDto[] = JSON.parse(
      (await AsyncStorage.getItem("downloaded_files")) || "[]",
    );
    const updatedFiles = [
      ...currentFiles.filter((i) => i.Id !== item.Id),
      item,
    ];
    await AsyncStorage.setItem(
      "downloaded_files",
      JSON.stringify(updatedFiles),
    );
  } catch (error) {
    console.error("Error updating downloaded files:", error);
    writeToLog(
      "ERROR",
      `Failed to update downloaded files for item: ${item.Name}`,
    );
  }
}
