import { TouchableOpacity, View } from "react-native";
import { Text } from "../common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { router } from "expo-router";

export const EpisodeCard: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const open = () => {
    router.back();
    router.push(
      `/(auth)/player/offline/page?url=${item.Id}.${item.MediaSources?.[0].Container}&itemId=${item.Id}`
    );
  };

  return (
    <TouchableOpacity
      onPress={open}
      className="bg-neutral-800 border border-neutral-900 rounded-2xl p-4"
    >
      <Text className=" font-bold">{item.Name}</Text>
      <Text className=" text-xs opacity-50">Episode {item.IndexNumber}</Text>
    </TouchableOpacity>
  );
};
