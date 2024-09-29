import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import {
  ActionSheetProvider,
  useActionSheet,
} from "@expo/react-native-action-sheet";

import { runtimeTicksToMinutes } from "@/utils/time";
import { Text } from "../common/Text";

import { useFileOpener } from "@/hooks/useDownloadedFileOpener";
import { useDownload } from "@/providers/DownloadProvider";

interface MovieCardProps {
  item: BaseItemDto;
}

/**
 * MovieCard component displays a movie with action sheet options.
 * @param {MovieCardProps} props - The component props.
 * @returns {React.ReactElement} The rendered MovieCard component.
 */
export const MovieCard: React.FC<MovieCardProps> = ({ item }) => {
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
      <View className="flex flex-col">
        <Text className="text-xs opacity-50">{item.ProductionYear}</Text>
        <Text className="text-xs opacity-50">
          {runtimeTicksToMinutes(item.RunTimeTicks)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Wrap the parent component with ActionSheetProvider
export const MovieCardWithActionSheet: React.FC<MovieCardProps> = (props) => (
  <ActionSheetProvider>
    <MovieCard {...props} />
  </ActionSheetProvider>
);
