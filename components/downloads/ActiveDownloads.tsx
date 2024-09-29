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

export const ActiveDownloads: React.FC<Props> = ({ ...props }) => {
  const router = useRouter();
  const { removeProcess, processes } = useDownload();
  const [settings] = useSettings();

  const cancelJobMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!process) throw new Error("No active download");

      try {
        if (settings?.downloadMethod === "optimized") {
          await axios.delete(
            settings?.optimizedVersionsServerUrl + "cancel-job/" + id,
            {
              headers: {
                Authorization: `Bearer ${settings?.optimizedVersionsAuthHeader}`,
              },
            }
          );
          const tasks = await checkForExistingDownloads();
          for (const task of tasks) task.stop();
        } else {
          FFmpegKit.cancel();
        }
      } catch (e) {
        throw e;
      } finally {
        removeProcess(id);
      }
    },
    onSuccess: () => {
      toast.success("Download canceled");
    },
    onError: (e) => {
      console.log(e);
      toast.error("Failed to cancel download on the server");
    },
  });

  if (processes.length === 0)
    return (
      <View {...props} className="bg-neutral-900 p-4 rounded-2xl">
        <Text className="text-lg font-bold">Active download</Text>
        <Text className="opacity-50">No active downloads</Text>
      </View>
    );

  return (
    <View {...props} className="bg-neutral-900 p-4 rounded-2xl">
      <Text className="text-lg font-bold mb-2">Active downloads</Text>
      <View className="space-y-2">
        {processes.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => router.push(`/(auth)/items/page?id=${p.item.Id}`)}
            className="relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
          >
            <View
              className={`
            bg-purple-600 h-1 absolute bottom-0 left-0
            `}
              style={{
                width: p.progress ? `${Math.max(5, p.progress)}%` : "5%",
              }}
            ></View>
            <View className="p-4 flex flex-row items-center justify-between w-full">
              <View>
                <Text className="font-semibold">{p.item.Name}</Text>
                <Text className="text-xs opacity-50">{p.item.Type}</Text>
                <View className="flex flex-row items-center space-x-4">
                  <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
                    <Text className="text-xs">{p.progress.toFixed(0)}%</Text>
                  </View>
                  {p.speed && (
                    <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
                      <Text className="text-xs">{p.speed.toFixed(2)}%</Text>
                    </View>
                  )}
                </View>
                <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
                  <Text className="text-xs capitalize">{p.state}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => cancelJobMutation.mutate(p.id)}>
                <Ionicons name="close" size={24} color="red" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
