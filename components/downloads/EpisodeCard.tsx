import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import * as ContextMenu from "zeego/context-menu";
import { Text } from "../common/Text";
import { useFiles } from "@/hooks/useFiles";
import * as Haptics from "expo-haptics";
import { useRef, useMemo } from "react";
import Video, { VideoRef } from "react-native-video";
import * as FileSystem from "expo-file-system";

export const EpisodeCard: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const { deleteFile } = useFiles();
  const videoRef = useRef<VideoRef | null>(null);

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
            className="bg-neutral-800 border border-neutral-900 rounded-2xl p-4"
          >
            <Text className=" font-bold">{item.Name}</Text>
            <Text className=" text-xs opacity-50">
              Episode {item.IndexNumber}
            </Text>
          </TouchableOpacity>
        </ContextMenu.Trigger>
        <ContextMenu.Content
          alignOffset={0}
          avoidCollisions
          collisionPadding={10}
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
        ref={videoRef}
        resizeMode="contain"
        reportBandwidth
      />
    </>
  );
};
