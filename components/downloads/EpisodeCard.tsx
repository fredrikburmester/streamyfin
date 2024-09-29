import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef } from "react";
import { TouchableOpacity } from "react-native";
import {
  ActionSheetProvider,
  useActionSheet,
} from "@expo/react-native-action-sheet";

import { useFileOpener } from "@/hooks/useDownloadedFileOpener";
import { Text } from "../common/Text";
import { useDownload } from "@/providers/DownloadProvider";

interface EpisodeCardProps {
  item: BaseItemDto;
}

/**
 * EpisodeCard component displays an episode with action sheet options.
 * @param {EpisodeCardProps} props - The component props.
 * @returns {React.ReactElement} The rendered EpisodeCard component.
 */
export const EpisodeCard: React.FC<EpisodeCardProps> = ({ item }) => {
  const { deleteFile } = useDownload();
  const { openFile } = useFileOpener();
  const { showActionSheetWithOptions } = useActionSheet();

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

  const showActionSheet = useCallback(() => {
    const options = ["Delete", "Cancel"];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (selectedIndex) => {
        switch (selectedIndex) {
          case destructiveButtonIndex:
            // Delete
            handleDeleteFile();
            break;
          case cancelButtonIndex:
            // Cancelled
            break;
        }
      }
    );
  }, [showActionSheetWithOptions, handleDeleteFile]);

  return (
    <TouchableOpacity
      onPress={handleOpenFile}
      onLongPress={showActionSheet}
      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
    >
      <Text className="font-bold">{item.Name}</Text>
      <Text className="text-xs opacity-50">Episode {item.IndexNumber}</Text>
    </TouchableOpacity>
  );
};

// Wrap the parent component with ActionSheetProvider
export const EpisodeCardWithActionSheet: React.FC<EpisodeCardProps> = (
  props
) => (
  <ActionSheetProvider>
    <EpisodeCard {...props} />
  </ActionSheetProvider>
);
