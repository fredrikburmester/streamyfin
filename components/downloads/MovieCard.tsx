import { TouchableOpacity, View } from "react-native";
import { Text } from "../common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { runtimeTicksToMinutes } from "@/utils/time";
import * as ContextMenu from "zeego/context-menu";
import { router } from "expo-router";
import { useFiles } from "@/hooks/useFiles";
import Video, {
  OnBufferData,
  OnPlaybackStateChangedData,
  OnProgressData,
  OnVideoErrorData,
  VideoRef,
} from "react-native-video";
import * as FileSystem from "expo-file-system";
import { useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";

export const MovieCard: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const { deleteFile } = useFiles();
  const videoRef = useRef<VideoRef | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const openFile = () => {
    videoRef.current?.presentFullscreenPlayer();
  };

  const fileUrl = useMemo(() => {
    return `${FileSystem.documentDirectory}/${item.Id}.mp4`;
  }, [item]);

  const options = [
    {
      label: "Delete",
      onSelect: (id: string) => {
        deleteFile(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      destructive: true,
    },
  ];

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <TouchableOpacity
            onPress={openFile}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
          >
            <Text className=" font-bold">{item.Name}</Text>
            <View className="flex flex-row items-center justify-between">
              <Text className=" text-xs opacity-50">{item.ProductionYear}</Text>
              <Text className=" text-xs opacity-50">
                {runtimeTicksToMinutes(item.RunTimeTicks)}
              </Text>
            </View>
          </TouchableOpacity>
        </ContextMenu.Trigger>
        <ContextMenu.Content
          alignOffset={0}
          avoidCollisions={false}
          collisionPadding={0}
          loop={false}
        >
          {options.map((i) => (
            <ContextMenu.Item
              onSelect={() => {
                i.onSelect(item.Id!);
              }}
              key={i.label}
              destructive={i.destructive}
            >
              <ContextMenu.ItemTitle
                style={{
                  color: "red",
                }}
              >
                {i.label}
              </ContextMenu.ItemTitle>
            </ContextMenu.Item>
          ))}
        </ContextMenu.Content>
      </ContextMenu.Root>

      <Video
        style={{ width: 0, height: 0 }}
        source={{
          uri: fileUrl,
          isNetwork: false,
        }}
        controls
        onFullscreenPlayerDidDismiss={() => {
          setIsPlaying(false);
          videoRef.current?.pause();
        }}
        onFullscreenPlayerDidPresent={() => {
          setIsPlaying(true);
          videoRef.current?.resume();
        }}
        ref={videoRef}
        resizeMode="contain"
        paused={!isPlaying}
      />
    </>
  );
};
