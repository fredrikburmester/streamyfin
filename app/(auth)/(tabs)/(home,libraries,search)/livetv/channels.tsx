import { ItemImage } from "@/components/common/ItemImage";
import { Text } from "@/components/common/Text";
import { ItemPoster } from "@/components/posters/ItemPoster";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getLiveTvApi } from "@jellyfin/sdk/lib/utils/api";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function page() {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const insets = useSafeAreaInsets();

  const { data: channels } = useQuery({
    queryKey: ["livetv", "channels"],
    queryFn: async () => {
      if (!api) return [];
      const res = await getLiveTvApi(api).getLiveTvChannels({
        startIndex: 0,
        fields: ["PrimaryImageAspectRatio"],
        limit: 100,
        userId: user?.Id,
      });
      return res.data.Items;
    },
  });

  return (
    <View className="flex flex-1">
      <FlashList
        data={channels}
        estimatedItemSize={76}
        renderItem={({ item }) => (
          <View className="flex flex-row items-center px-4 mb-2">
            <View className="w-22 mr-4 rounded-lg overflow-hidden">
              <ItemImage
                style={{
                  aspectRatio: "1/1",
                  width: 60,
                  borderRadius: 8,
                }}
                item={item}
              />
            </View>
            <Text className="font-bold">{item.Name}</Text>
          </View>
        )}
      />
    </View>
  );
}
