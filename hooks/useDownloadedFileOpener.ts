// hooks/useFileOpener.ts

import { useCallback } from "react";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { usePlayback } from "@/providers/PlaybackProvider";
import { FFmpegKit, ReturnCode } from "ffmpeg-kit-react-native";

export const useFileOpener = () => {
  const router = useRouter();
  const { startDownloadedFilePlayback } = usePlayback();

  const openFile = useCallback(
    async (item: BaseItemDto) => {
      const m3u8File = `${FileSystem.documentDirectory}${item.Id}/local.m3u8`;
      const outputFile = `${FileSystem.documentDirectory}${item.Id}/output.mp4`;

      console.log("Checking for output file:", outputFile);

      const outputFileInfo = await FileSystem.getInfoAsync(outputFile);

      if (outputFileInfo.exists) {
        console.log("Output MP4 file already exists. Playing directly.");
        startDownloadedFilePlayback({
          item,
          url: outputFile,
        });
        router.push("/play");
        return;
      }

      console.log("Output MP4 file does not exist. Converting from M3U8.");

      const m3u8FileInfo = await FileSystem.getInfoAsync(m3u8File);

      if (!m3u8FileInfo.exists) {
        console.warn("m3u8 file does not exist:", m3u8File);
        return;
      }

      const conversionSuccess = await convertM3U8ToMP4(m3u8File, outputFile);

      if (conversionSuccess) {
        startDownloadedFilePlayback({
          item,
          url: outputFile,
        });
        router.push("/play");
      } else {
        console.error("Failed to convert M3U8 to MP4");
        // Handle conversion failure (e.g., show an error message to the user)
      }
    },
    [startDownloadedFilePlayback]
  );

  return { openFile };
};

export async function convertM3U8ToMP4(
  inputM3U8: string,
  outputMP4: string
): Promise<boolean> {
  console.log("Converting M3U8 to MP4");
  console.log("Input M3U8:", inputM3U8);
  console.log("Output MP4:", outputMP4);

  try {
    const command = `-i ${inputM3U8} -c copy ${outputMP4}`;
    console.log("Executing FFmpeg command:", command);

    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      console.log("Conversion completed successfully");
      return true;
    } else {
      console.error("Conversion failed. Return code:", returnCode);
      const output = await session.getOutput();
      console.error("FFmpeg output:", output);
      return false;
    }
  } catch (error) {
    console.error("Error during conversion:", error);
    return false;
  }
}
