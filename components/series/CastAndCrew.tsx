import { apiAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";
import {
  BaseItemDto,
  BaseItemPerson,
} from "@jellyfin/sdk/lib/generated-client/models";
import { router } from "expo-router";
import { useAtom } from "jotai";
import React from "react";
import { TouchableOpacity, View, ViewProps } from "react-native";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { Text } from "../common/Text";
import Poster from "../posters/Poster";

interface Props extends ViewProps {
  item?: BaseItemDto | null;
  loading?: boolean;
}

export const CastAndCrew: React.FC<Props> = ({ item, loading, ...props }) => {
  const [api] = useAtom(apiAtom);

  return (
    <View {...props} className="flex flex-col">
      <Text className="text-lg font-bold mb-2 px-4">Cast & Crew</Text>
      <HorizontalScroll
        loading={loading}
        height={247}
        data={item?.People || []}
        renderItem={(item, index) => (
          <TouchableOpacity
            onPress={() => {
              router.push(`/actors/${item.Id}`);
            }}
            key={item.Id}
            className="flex flex-col w-28"
          >
            <Poster item={item} url={getPrimaryImageUrl({ api, item })} />
            <Text className="mt-2">{item.Name}</Text>
            <Text className="text-xs opacity-50">{item.Role}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
