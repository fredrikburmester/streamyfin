import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { markAsNotPlayed, markAsPlayed } from "@/utils/jellyfin";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQueryClient, InvalidateQueryFilters } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";

export const PlayedStatus: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["item", item.Id],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["resumeItems", user?.Id],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["nextUp", item.SeriesId],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["episodes"],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["seasons"],
      refetchType: "all",
    });
  }, [api, item.Id, queryClient, user?.Id]);

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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            invalidateQueries();
          }}
        >
          <Ionicons name="checkmark-circle" size={26} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            markAsPlayed({
              api: api,
              item: item,
              userId: user?.Id,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            invalidateQueries();
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={26} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};
