import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { Text } from "../common/Text";
import Poster from "../Poster";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { router } from "expo-router";

export const NextUp = ({ items }: { items?: BaseItemDto[] | null }) => {
  if (!items?.length)
    return (
      <View>
        <Text className="text-lg font-bold mb-2">Next up</Text>
        <Text className="opacity-50">No items to display</Text>
      </View>
    );

  return (
    <View>
      <Text className="text-lg font-bold mb-2">Next up</Text>
      <HorizontalScroll<BaseItemDto>
        data={items}
        renderItem={(item, index) => (
          <TouchableOpacity
            onPress={() => {
              router.push(`/(auth)/items/${item.Id}/page`);
            }}
            key={item.Id}
            className="flex flex-col w-32"
          >
            <ContinueWatchingPoster item={item} />
            <ItemCardText item={item} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
