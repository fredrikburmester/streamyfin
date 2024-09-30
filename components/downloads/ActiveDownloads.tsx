import { Text } from "@/components/common/Text";
import { useDownload } from "@/providers/DownloadProvider";
import { apiAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { JobStatus } from "@/utils/optimize-server";
import { formatTimeString } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { checkForExistingDownloads } from "@kesha-antonov/react-native-background-downloader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import { useAtom } from "jotai";
import {
  ActivityIndicator,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
} from "react-native";
import { toast } from "sonner-native";

interface Props extends ViewProps {}

export const ActiveDownloads: React.FC<Props> = ({ ...props }) => {
  const { processes } = useDownload();
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
          <DownloadCard key={p.id} process={p} />
        ))}
      </View>
    </View>
  );
};

interface DownloadCardProps extends TouchableOpacityProps {
  process: JobStatus;
}

const DownloadCard = ({ process, ...props }: DownloadCardProps) => {
  const router = useRouter();
  const { removeProcess, setProcesses } = useDownload();
  const [settings] = useSettings();
  const queryClient = useQueryClient();

  const cancelJobMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!process) throw new Error("No active download");

      if (settings?.downloadMethod === "optimized") {
        try {
          const tasks = await checkForExistingDownloads();
          for (const task of tasks) {
            if (task.id === id) {
              task.stop();
            }
          }
        } catch (e) {
          throw e;
        } finally {
          await removeProcess(id);
          await queryClient.refetchQueries({ queryKey: ["jobs"] });
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

  const eta = (p: JobStatus) => {
    if (!p.speed || !p.progress) return null;

    const length = p?.item?.RunTimeTicks || 0;
    const timeLeft = (length - length * (p.progress / 100)) / p.speed;
    return formatTimeString(timeLeft, true);
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(auth)/items/page?id=${process.item.Id}`)}
      className="relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
      {...props}
    >
      <View
        className={`
        bg-purple-600 h-1 absolute bottom-0 left-0
        `}
        style={{
          width: process.progress ? `${Math.max(5, process.progress)}%` : "5%",
        }}
      ></View>
      <View className="p-4 flex flex-row items-center justify-between w-full">
        <View className="shrink">
          <Text className="font-semibold shrink">{process.item.Name}</Text>
          <Text className="text-xs opacity-50">{process.item.Type}</Text>
          <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
            <Text className="text-xs">{process.progress.toFixed(0)}%</Text>
            {process.speed && (
              <Text className="text-xs">{process.speed?.toFixed(2)}x</Text>
            )}
            {eta(process) && (
              <View>
                <Text className="text-xs">ETA {eta(process)}</Text>
              </View>
            )}
          </View>
          <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
            <Text className="text-xs capitalize">{process.status}</Text>
          </View>
        </View>
        <TouchableOpacity
          disabled={cancelJobMutation.isPending}
          onPress={() => cancelJobMutation.mutate(process.id)}
        >
          {cancelJobMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="close" size={24} color="red" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
