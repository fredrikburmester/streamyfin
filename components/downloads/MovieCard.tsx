import { View } from "react-native";
import { Text } from "../common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { runtimeTicksToMinutes } from "@/utils/time";

export const MovieCard: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  return (
    <View className="bg-neutral-800 border border-neutral-900 rounded-2xl p-4">
      <Text className=" font-bold">{item.Name}</Text>
      <View className="flex flex-row items-center justify-between">
        <Text className=" text-xs opacity-50">{item.ProductionYear}</Text>
        <Text className=" text-xs opacity-50">
          {runtimeTicksToMinutes(item.RunTimeTicks)}
        </Text>
      </View>
    </View>
  );
};
