import { useCallback } from "react";
import { useAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { FFmpegKit, FFmpegKitConfig } from "ffmpeg-kit-react-native";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { writeToLog } from "@/utils/log";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useDownload } from "@/providers/DownloadProvider";

/**
 * Custom hook for remuxing HLS to MP4 using FFmpeg.
 *
 * @param url - The URL of the HLS stream
 * @param item - The BaseItemDto object representing the media item
 * @returns An object with remuxing-related functions
 */
export const useRemuxHlsToMp4 = (item: BaseItemDto) => {
  const queryClient = useQueryClient();
  const { process, updateProcess, clearProcess, saveDownloadedItemInfo } =
    useDownload();

  if (!item.Id || !item.Name) {
    writeToLog("ERROR", "useRemuxHlsToMp4 ~ missing arguments");
    throw new Error("Item must have an Id and Name");
  }

  const output = `${FileSystem.documentDirectory}${item.Id}.mp4`;

  const startRemuxing = useCallback(
    async (url: string) => {
      if (!item.Id) throw new Error("Item must have an Id");

      toast.success("Download started");

      const command = `-y -loglevel quiet -thread_queue_size 512 -protocol_whitelist file,http,https,tcp,tls,crypto -multiple_requests 1 -tcp_nodelay 1 -fflags +genpts -i ${url} -c copy -bufsize 50M -max_muxing_queue_size 4096 ${output}`;

      writeToLog(
        "INFO",
        `useRemuxHlsToMp4 ~ startRemuxing for item ${item.Name}`
      );

      try {
        updateProcess({
          id: item.Id,
          item,
          progress: 0,
          state: "downloading",
        });

        FFmpegKitConfig.enableStatisticsCallback((statistics) => {
          const videoLength =
            (item.MediaSources?.[0]?.RunTimeTicks || 0) / 10000000; // In seconds
          const fps = item.MediaStreams?.[0]?.RealFrameRate || 25;
          const totalFrames = videoLength * fps;
          const processedFrames = statistics.getVideoFrameNumber();

          const percentage =
            totalFrames > 0
              ? Math.floor((processedFrames / totalFrames) * 100)
              : 0;

          updateProcess((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              progress: percentage,
            };
          });
        });

        // Await the execution of the FFmpeg command and ensure that the callback is awaited properly.
        await new Promise<void>((resolve, reject) => {
          FFmpegKit.executeAsync(command, async (session) => {
            try {
              const returnCode = await session.getReturnCode();

              if (returnCode.isValueSuccess()) {
                if (!item) throw new Error("Item is undefined");
                await saveDownloadedItemInfo(item);
                toast.success("Download completed");
                writeToLog(
                  "INFO",
                  `useRemuxHlsToMp4 ~ remuxing completed successfully for item: ${item.Name}`
                );
                await queryClient.invalidateQueries({
                  queryKey: ["downloadedItems"],
                });
                resolve();
              } else if (returnCode.isValueError()) {
                toast.success("Download failed");
                writeToLog(
                  "ERROR",
                  `useRemuxHlsToMp4 ~ remuxing failed for item: ${item.Name}`
                );
                reject(new Error("Remuxing failed")); // Reject the promise on error
              } else if (returnCode.isValueCancel()) {
                toast.success("Download canceled");
                writeToLog(
                  "INFO",
                  `useRemuxHlsToMp4 ~ remuxing was canceled for item: ${item.Name}`
                );
                resolve();
              }

              clearProcess();
            } catch (error) {
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error("Failed to remux:", error);
        writeToLog(
          "ERROR",
          `useRemuxHlsToMp4 ~ remuxing failed for item: ${item.Name}`
        );
        clearProcess();
        throw error; // Re-throw the error to propagate it to the caller
      }
    },
    [output, item, clearProcess]
  );

  const cancelRemuxing = useCallback(() => {
    FFmpegKit.cancel();
    clearProcess();
  }, [item.Name, clearProcess]);

  return { startRemuxing, cancelRemuxing };
};
