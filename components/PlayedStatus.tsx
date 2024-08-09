import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { markAsNotPlayed } from "@/utils/jellyfin/playstate/markAsNotPlayed";
import { markAsPlayed } from "@/utils/jellyfin/playstate/markAsPlayed";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAtom } from "jotai";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";

export const PlayedStatus: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["item", item.Id],
    });
    queryClient.invalidateQueries({
      queryKey: ["resumeItems", user?.Id],
    });
    queryClient.invalidateQueries({
      queryKey: ["nextUp", item.SeriesId],
    });
    queryClient.invalidateQueries({
      queryKey: ["episodes"],
    });
    queryClient.invalidateQueries({
      queryKey: ["seasons"],
    });
  }, [api, item.Id, queryClient, user?.Id]);

  return (
    <View>
      {item.UserData?.Played ? (
        <TouchableOpacity
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await markAsNotPlayed({
              api: api,
              itemId: item?.Id,
              userId: user?.Id,
            });
            invalidateQueries();
          }}
        >
          <Ionicons name="checkmark-circle" size={26} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await markAsPlayed({
              api: api,
              item: item,
              userId: user?.Id,
            });
            invalidateQueries();
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={26} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};
