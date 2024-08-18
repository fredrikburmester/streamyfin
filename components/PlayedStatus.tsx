import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { markAsNotPlayed } from "@/utils/jellyfin/playstate/markAsNotPlayed";
import { markAsPlayed } from "@/utils/jellyfin/playstate/markAsPlayed";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export const PlayedStatus: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["item"],
    });
    queryClient.invalidateQueries({
      queryKey: ["resumeItems"],
    });
    queryClient.invalidateQueries({
      queryKey: ["nextUp"],
    });
    queryClient.invalidateQueries({
      queryKey: ["episodes"],
    });
    queryClient.invalidateQueries({
      queryKey: ["seasons"],
    });
    queryClient.invalidateQueries({
      queryKey: ["nextUp-all"],
    });
  };

  return (
    <View>
      {item.UserData?.Played ? (
        <TouchableOpacity
          onPress={async () => {
            await markAsNotPlayed({
              api: api,
              itemId: item?.Id,
              userId: user?.Id,
            });
            invalidateQueries();
          }}
        >
          <View className="rounded h-10 aspect-square flex items-center justify-center">
            <Ionicons name="checkmark-circle" size={30} color="white" />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={async () => {
            await markAsPlayed({
              api: api,
              item: item,
              userId: user?.Id,
            });
            invalidateQueries();
          }}
        >
          <View className="rounded h-10 aspect-square flex items-center justify-center">
            <Ionicons name="checkmark-circle-outline" size={30} color="white" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};
