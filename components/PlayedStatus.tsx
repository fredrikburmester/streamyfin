import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { markAsNotPlayed, markAsPlayed } from "@/utils/jellyfin";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQueryClient, InvalidateQueryFilters } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";

export const PlayedStatus: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  console.log("PlayedStatus", item.UserData);

  const queryClient = useQueryClient();

  return (
    <View>
      {item.UserData?.Played ? (
        <TouchableOpacity
          onPress={() => {
            markAsNotPlayed({
              api: api,
              itemId: item?.Id,
              userId: user?.Id,
            });
            queryClient.invalidateQueries({
              queryKey: ["item", item.Id],
              refetchType: "all",
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons name="checkmark-circle" size={30} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            markAsPlayed({
              api: api,
              itemId: item?.Id,
              userId: user?.Id,
            });
            queryClient.invalidateQueries({
              queryKey: ["item", item.Id],
              refetchType: "all",
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};
