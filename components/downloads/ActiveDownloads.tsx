import { Text } from "@/components/common/Text";
import { useDownload } from "@/providers/DownloadProvider";
import { apiAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { cancelJobById, JobStatus } from "@/utils/optimize-server";
import { formatTimeString } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { checkForExistingDownloads } from "@kesha-antonov/react-native-background-downloader";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "expo-router";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { TouchableOpacity, View, ViewProps } from "react-native";
import { toast } from "sonner-native";

interface Props extends ViewProps {}

export const ActiveDownloads: React.FC<Props> = ({ ...props }) => {
  const router = useRouter();
  const { removeProcess, processes, setProcesses } = useDownload();
  const [settings] = useSettings();
  const [api] = useAtom(apiAtom);

  const cancelJobMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!process) throw new Error("No active download");

      if (settings?.downloadMethod === "optimized") {
        try {
          const tasks = await checkForExistingDownloads();
          for (const task of tasks) {
            if (task.id === id) {
              await task.stop();
            }
          }
        } catch (e) {
          throw e;
        } finally {
          removeProcess(id);
        }
      } else {
        FFmpegKit.cancel();
        setProcesses((prev) => prev.filter((p) => p.id !== id));
      }
    },
    onSuccess: () => {
      toast.success("Download canceled");
    },
    onError: (e) => {
      console.log(e);
      toast.error("Could not cancel download");
    },
  });

  const eta = useCallback(
    (p: JobStatus) => {
      if (!p.speed || !p.progress) return null;

      const length = p?.item?.RunTimeTicks || 0;
      const timeLeft = (length - length * (p.progress / 100)) / p.speed;
      return formatTimeString(timeLeft, true);
    },
    [process]
  );

  if (processes?.length === 0)
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
        {processes?.map((p) => (
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
                <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
                  <Text className="text-xs">{p.progress.toFixed(0)}%</Text>
                  {p.speed && (
                    <Text className="text-xs">{p.speed?.toFixed(2)}x</Text>
                  )}
                  {eta(p) && (
                    <View>
                      <Text className="text-xs">ETA {eta(p)}</Text>
                    </View>
                  )}
                </View>
                <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
                  <Text className="text-xs capitalize">{p.status}</Text>
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
