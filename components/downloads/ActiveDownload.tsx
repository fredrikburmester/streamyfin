import { TouchableOpacity, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { useRouter } from "expo-router";
import { checkForExistingDownloads } from "@kesha-antonov/react-native-background-downloader";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useDownload } from "@/providers/DownloadProvider";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner-native";
import { useSettings } from "@/utils/atoms/settings";
import { FFmpegKit } from "ffmpeg-kit-react-native";

interface Props extends ViewProps {}

export const ActiveDownload: React.FC<Props> = ({ ...props }) => {
  const router = useRouter();
  const { clearProcess, process } = useDownload();
  const [settings] = useSettings();

  const cancelJobMutation = useMutation({
    mutationFn: async () => {
      if (!process) throw new Error("No active download");

      if (settings?.downloadMethod === "optimized") {
        await axios.delete(
          settings?.optimizedVersionsServerUrl + "cancel-job/" + process.id,
          {
            headers: {
              Authorization: `Bearer ${settings?.optimizedVersionsAuthHeader}`,
            },
          }
        );
        const tasks = await checkForExistingDownloads();
        for (const task of tasks) task.stop();
        clearProcess();
      } else {
        FFmpegKit.cancel();
        clearProcess();
      }
    },
    onSuccess: () => {
      toast.success("Download canceled");
    },
    onError: (e) => {
      console.log(e);
      toast.error("Failed to cancel download");
      clearProcess();
    },
  });

  if (!process)
    return (
      <View {...props}>
        <Text className="text-2xl font-bold mb-2">Active download</Text>
        <Text className="opacity-50">No active downloads</Text>
      </View>
    );

  return (
    <View {...props}>
      <Text className="text-2xl font-bold mb-2">Active download</Text>
      <TouchableOpacity
        onPress={() => router.push(`/(auth)/items/page?id=${process.item.Id}`)}
        className="relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
      >
        <View
          className={`
            bg-purple-600 h-1 absolute bottom-0 left-0
            `}
          style={{
            width: process.progress
              ? `${Math.max(5, process.progress)}%`
              : "5%",
          }}
        ></View>
        <View className="p-4 flex flex-row items-center justify-between w-full">
          <View>
            <Text className="font-semibold">{process.item.Name}</Text>
            <Text className="text-xs opacity-50">{process.item.Type}</Text>
            <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
              <Text className="text-xs">{process.progress.toFixed(0)}%</Text>
            </View>
            <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
              <Text className="text-xs capitalize">{process.state}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => cancelJobMutation.mutate()}>
            <Ionicons name="close" size={24} color="red" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};
