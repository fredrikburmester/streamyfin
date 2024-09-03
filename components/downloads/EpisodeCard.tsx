import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import * as ContextMenu from "zeego/context-menu";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { useAtom } from "jotai";

import { Text } from "../common/Text";
import { useFiles } from "@/hooks/useFiles";
import { useSettings } from "@/utils/atoms/settings";
import { usePlayback } from "@/providers/PlaybackProvider";

interface EpisodeCardProps {
  item: BaseItemDto;
}

/**
 * EpisodeCard component displays an episode with context menu options.
 * @param {EpisodeCardProps} props - The component props.
 * @returns {React.ReactElement} The rendered EpisodeCard component.
 */
export const EpisodeCard: React.FC<EpisodeCardProps> = ({ item }) => {
  const { deleteFile } = useFiles();

  const { startDownloadedFilePlayback } = usePlayback();

  const handleOpenFile = useCallback(async () => {
    startDownloadedFilePlayback({
      item,
      url: `${FileSystem.documentDirectory}/${item.Id}.mp4`,
    });
  }, [item, startDownloadedFilePlayback]);

  /**
   * Handles deleting the file with haptic feedback.
   */
  const handleDeleteFile = useCallback(() => {
    if (item.Id) {
      deleteFile(item.Id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [deleteFile, item.Id]);

  const contextMenuOptions = [
    {
      label: "Delete",
      onSelect: handleDeleteFile,
      destructive: true,
    },
  ];

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <TouchableOpacity
          onPress={handleOpenFile}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
        >
          <Text className="font-bold">{item.Name}</Text>
          <Text className="text-xs opacity-50">Episode {item.IndexNumber}</Text>
        </TouchableOpacity>
      </ContextMenu.Trigger>
      <ContextMenu.Content
        alignOffset={0}
        avoidCollisions
        collisionPadding={10}
        loop={false}
      >
        {contextMenuOptions.map((option) => (
          <ContextMenu.Item
            key={option.label}
            onSelect={option.onSelect}
            destructive={option.destructive}
          >
            <ContextMenu.ItemTitle style={{ color: "red" }}>
              {option.label}
            </ContextMenu.ItemTitle>
          </ContextMenu.Item>
        ))}
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
};
