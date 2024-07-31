import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

import * as FileSystem from "expo-file-system";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FFmpegKit, FFmpegKitConfig, Session } from "ffmpeg-kit-react-native";
import ProgressCircle from "./ProgressCircle";
import { TouchableOpacity, View } from "react-native";
import { Text } from "./common/Text";

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
  if (!item.Id || !item.Name) throw new Error("Item must have an Id and Name");

  const [session, setSession] = useAtom<ProcessItem | null>(runningProcesses);

  const output = `${FileSystem.documentDirectory}${item.Id}.mp4`;

  const command = `-y -fflags +genpts -i ${inputUrl} -c copy -max_muxing_queue_size 9999 ${output}`;

  const startRemuxing = useCallback(async () => {
    if (!item.Id || !item.Name)
      throw new Error("Item must have an Id and Name");

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

        console.log({
          videoLength,
          fps,
          totalFrames,
          processedFrames: statistics.getVideoFrameNumber(),
          percentage,
        });

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

          console.log("Remuxing completed successfully");
          setSession(null);
        } else if (returnCode.isValueError()) {
          console.error("Failed to remux:");
          setSession(null);
        } else if (returnCode.isValueCancel()) {
          console.log("Remuxing was cancelled");
          setSession(null);
        }
      });
    } catch (error) {
      console.error("Failed to remux:", error);
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
        <>
          <Ionicons name="checkmark-circle-outline" size={24} color="white" />
        </>
      ) : (
        <TouchableOpacity
          onPress={() => {
            startRemuxing();
          }}
        >
          <Ionicons name="cloud-download-outline" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};
