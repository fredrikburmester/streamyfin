import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import * as ContextMenu from "zeego/context-menu";

import { useFiles } from "@/hooks/useFiles";
import { runtimeTicksToMinutes } from "@/utils/time";
import { Text } from "../common/Text";

import { useFileOpener } from "@/hooks/useDownloadedFileOpener";

interface MovieCardProps {
  item: BaseItemDto;
}

/**
 * MovieCard component displays a movie with context menu options.
 * @param {MovieCardProps} props - The component props.
 * @returns {React.ReactElement} The rendered MovieCard component.
 */
export const MovieCard: React.FC<MovieCardProps> = ({ item }) => {
  const { deleteFile } = useFiles();
  const { openFile } = useFileOpener();

  const handleOpenFile = useCallback(() => {
    openFile(item);
  }, [item, openFile]);

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
          <View className="flex flex-col">
            <Text className="text-xs opacity-50">{item.ProductionYear}</Text>
            <Text className="text-xs opacity-50">
              {runtimeTicksToMinutes(item.RunTimeTicks)}
            </Text>
          </View>
        </TouchableOpacity>
      </ContextMenu.Trigger>
      <ContextMenu.Content
        loop={false}
        alignOffset={0}
        avoidCollisions={false}
        collisionPadding={0}
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
