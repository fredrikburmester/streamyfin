import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

import { writeToLog } from "@/utils/log";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { FFmpegKit, FFmpegKitConfig } from "ffmpeg-kit-react-native";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import ProgressCircle from "./ProgressCircle";
import { router } from "expo-router";

type DownloadProps = {
  item: BaseItemDto;
  url: string;
};

type ProcessItem = {
  item: BaseItemDto;
  progress: number;
};

export const runningProcesses = atom<ProcessItem | null>(null);

const useRemuxHlsToMp4 = (inputUrl: string, item: BaseItemDto) => {
  if (!item.Id || !item.Name) {
    writeToLog("ERROR", "useRemuxHlsToMp4 ~ missing arguments", {
      item,
      inputUrl,
    });
    throw new Error("Item must have an Id and Name");
  }

  const [session, setSession] = useAtom<ProcessItem | null>(runningProcesses);

  const output = `${FileSystem.documentDirectory}${item.Id}.mp4`;

  const command = `-y -fflags +genpts -i ${inputUrl} -c copy -max_muxing_queue_size 9999 ${output}`;

  const startRemuxing = useCallback(async () => {
    if (!item.Id || !item.Name) {
      writeToLog(
        "ERROR",
        "useRemuxHlsToMp4 ~ startRemuxing ~ missing arguments",
        {
          item,
          inputUrl,
        }
      );
      throw new Error("Item must have an Id and Name");
    }

    writeToLog(
      "INFO",
      `useRemuxHlsToMp4 ~ startRemuxing for item ${item.Id} with url ${inputUrl}`,
      {
        item,
        inputUrl,
      }
    );

    try {
      setSession({
        item,
        progress: 0,
      });

      FFmpegKitConfig.enableStatisticsCallback((statistics) => {
        let percentage = 0;

        const videoLength =
          (item.MediaSources?.[0].RunTimeTicks || 0) / 10000000; // In seconds
        const fps = item.MediaStreams?.[0].RealFrameRate || 25;
        const totalFrames = videoLength * fps;

        const processedFrames = statistics.getVideoFrameNumber();

        if (totalFrames > 0) {
          percentage = Math.floor((processedFrames / totalFrames) * 100);
        }

        setSession((prev) => {
          return prev?.item.Id === item.Id!
            ? { ...prev, progress: percentage }
            : prev;
        });
      });

      await FFmpegKit.executeAsync(command, async (session) => {
        const returnCode = await session.getReturnCode();
        if (returnCode.isValueSuccess()) {
          const currentFiles: BaseItemDto[] = JSON.parse(
            (await AsyncStorage.getItem("downloaded_files")) || "[]"
          );

          const otherItems = currentFiles.filter((i) => i.Id !== item.Id);

          await AsyncStorage.setItem(
            "downloaded_files",
            JSON.stringify([...otherItems, item])
          );

          writeToLog(
            "INFO",
            `useRemuxHlsToMp4 ~ remuxing completed successfully for item: ${item.Name}`,
            {
              item,
              inputUrl,
            }
          );
          setSession(null);
        } else if (returnCode.isValueError()) {
          console.error("Failed to remux:");
          writeToLog(
            "ERROR",
            `useRemuxHlsToMp4 ~ remuxing failed for item: ${item.Name}`,
            {
              item,
              inputUrl,
            }
          );
          setSession(null);
        } else if (returnCode.isValueCancel()) {
          console.log("Remuxing was cancelled");
          writeToLog(
            "INFO",
            `useRemuxHlsToMp4 ~ remuxing was canceled for item: ${item.Name}`,
            {
              item,
              inputUrl,
            }
          );
          setSession(null);
        }
      });
    } catch (error) {
      console.error("Failed to remux:", error);
      writeToLog(
        "ERROR",
        `useRemuxHlsToMp4 ~ remuxing failed for item: ${item.Name}`,
        {
          item,
          inputUrl,
        }
      );
    }
  }, [inputUrl, output, item, command]);

  const cancelRemuxing = useCallback(async () => {
    FFmpegKit.cancel();
    setSession(null);
    console.log("Remuxing cancelled");
  }, []);

  return { session, startRemuxing, cancelRemuxing };
};

export const DownloadItem: React.FC<DownloadProps> = ({ url, item }) => {
  const { session, startRemuxing, cancelRemuxing } = useRemuxHlsToMp4(
    url,
    item
  );

  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [key, setKey] = useState<string>("");

  useEffect(() => {
    (async () => {
      const data: BaseItemDto[] = JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]"
      );

      if (data.find((d) => d.Id === item.Id)) setDownloaded(true);
    })();
  }, [key]);

  if (session && session.item.Id !== item.Id!) {
    return (
      <TouchableOpacity onPress={() => {}} style={{ opacity: 0.5 }}>
        <Ionicons name="cloud-download-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {session ? (
        <TouchableOpacity
          onPress={() => {
            cancelRemuxing();
          }}
          className="-rotate-45"
        >
          <ProgressCircle
            size={22}
            fill={session.progress}
            width={3}
            tintColor="#3498db"
            backgroundColor="#bdc3c7"
          />
        </TouchableOpacity>
      ) : downloaded ? (
        <TouchableOpacity
          onPress={() => {
            router.push(
              `/(auth)/player/offline/page?url=${item.Id}.mp4&itemId=${item.Id}`
            );
          }}
        >
          <Ionicons name="cloud-download" size={28} color="#16a34a" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            startRemuxing();
          }}
        >
          <Ionicons name="cloud-download-outline" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};
