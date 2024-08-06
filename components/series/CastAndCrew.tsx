import { getPrimaryImage } from "@/utils/jellyfin";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { Text } from "../common/Text";
import Poster from "../Poster";
import { useAtom } from "jotai";
import { apiAtom } from "@/providers/JellyfinProvider";

export const CastAndCrew = ({ item }: { item: BaseItemDto }) => {
  const [api] = useAtom(apiAtom);
  return (
    <View>
      <Text className="text-lg font-bold mb-2 px-4">Cast & Crew</Text>
      <HorizontalScroll<NonNullable<BaseItemDto["People"]>[number]>
        data={item.People}
        renderItem={(item, index) => (
          <TouchableOpacity key={item.Id} className="flex flex-col w-32">
            <Poster item={item} url={getPrimaryImage({ api, item })} />
            <Text className="mt-2">{item.Name}</Text>
            <Text className="text-xs opacity-50">{item.Role}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
