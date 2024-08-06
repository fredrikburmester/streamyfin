import { OfflineVideoPlayer } from "@/components/OfflineVideoPlayer";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";

export default function page() {
  const searchParams = useLocalSearchParams();
  const { itemId, url } = searchParams as { itemId: string; url: string };

  const fileUrl = useMemo(() => {
    const u = FileSystem.documentDirectory + url;
    console.log({ u });
    return u;
  }, [url]);

  if (!fileUrl) return null;

  return (
    <View className="h-screen w-screen items-center justify-center">
      {url && <OfflineVideoPlayer url={fileUrl} />}
    </View>
  );
}
