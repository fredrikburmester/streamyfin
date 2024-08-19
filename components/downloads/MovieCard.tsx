import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import * as ContextMenu from "zeego/context-menu";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useAtom } from "jotai";

import { Text } from "../common/Text";
import { useFiles } from "@/hooks/useFiles";
import { runtimeTicksToMinutes } from "@/utils/time";

import { useSettings } from "@/utils/atoms/settings";
import {
  currentlyPlayingItemAtom,
  playingAtom,
  fullScreenAtom,
} from "@/utils/atoms/playState";

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
  const [, setCurrentlyPlaying] = useAtom(currentlyPlayingItemAtom);
  const [, setPlaying] = useAtom(playingAtom);
  const [, setFullscreen] = useAtom(fullScreenAtom);
  const [settings] = useSettings();

  /**
   * Handles opening the file for playback.
   */
  const handleOpenFile = useCallback(() => {
    console.log("Open movie file", item.Name);
    setCurrentlyPlaying({
      item,
      playbackUrl: `${FileSystem.documentDirectory}/${item.Id}.mp4`,
    });
    setPlaying(true);
    if (settings?.openFullScreenVideoPlayerByDefault === true) {
      setFullscreen(true);
    }
  }, [item, setCurrentlyPlaying, setPlaying, settings]);

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
