import { apiAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { router } from "expo-router";
import { useAtom } from "jotai";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Poster from "../Poster";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { Text } from "../common/Text";
import { getPrimaryImageUrlById } from "@/utils/jellyfin/image/getPrimaryImageUrlById";

export const CurrentSeries = ({ item }: { item: BaseItemDto }) => {
  const [api] = useAtom(apiAtom);

  return (
    <View>
      <Text className="text-lg font-bold mb-2 px-4">Series</Text>
      <HorizontalScroll<BaseItemDto>
        data={[item]}
        renderItem={(item, index) => (
          <TouchableOpacity
            key={item.Id}
            onPress={() => router.push(`/series/${item.SeriesId}`)}
            className="flex flex-col space-y-2 w-32"
          >
            <Poster
              item={item}
              url={getPrimaryImageUrlById({ api, id: item.ParentId })}
            />
            <Text>{item.SeriesName}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
