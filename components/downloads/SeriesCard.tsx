import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { ScrollView, View } from "react-native";
import { EpisodeCard } from "./EpisodeCard";
import { Text } from "../common/Text";
import { useMemo } from "react";
import { SeasonPicker } from "../series/SeasonPicker";

export const SeriesCard: React.FC<{ items: BaseItemDto[] }> = ({ items }) => {
  const groupBySeason = useMemo(() => {
    const seasons: Record<string, BaseItemDto[]> = {};

    items.forEach((item) => {
      if (!seasons[item.SeasonName!]) {
        seasons[item.SeasonName!] = [];
      }

      seasons[item.SeasonName!].push(item);
    });

    return Object.values(seasons).sort(
      (a, b) => a[0].IndexNumber! - b[0].IndexNumber!
    );
  }, [items]);

  const sortByIndex = (a: BaseItemDto, b: BaseItemDto) => {
    return a.IndexNumber! > b.IndexNumber! ? 1 : -1;
  };

  return (
    <View>
      <View className="flex flex-row items-center justify-between px-4">
        <Text className="text-lg font-bold shrink">{items[0].SeriesName}</Text>
        <View className="bg-purple-600 rounded-full h-6 w-6 flex items-center justify-center">
          <Text className="text-xs font-bold">{items.length}</Text>
        </View>
      </View>

      <Text className="opacity-50 mb-2 px-4">TV-Series</Text>
      {groupBySeason.map((seasonItems, seasonIndex) => (
        <View key={seasonIndex}>
          <Text className="mb-2 font-semibold px-4">
            {seasonItems[0].SeasonName}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="px-4 flex flex-row">
              {seasonItems.sort(sortByIndex)?.map((item, index) => (
                <EpisodeCard item={item} key={index} />
              ))}
            </View>
          </ScrollView>
        </View>
      ))}
    </View>
  );
};
