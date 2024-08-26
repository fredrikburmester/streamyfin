import { Text } from "@/components/common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { View, ViewProps } from "react-native";

interface Props extends ViewProps {
  item: BaseItemDto;
}

export const MoviesTitleHeader: React.FC<Props> = ({ item, ...props }) => {
  return (
    <View className="flex flex-col" {...props}>
      <Text className="text-center font-bold text-2xl">{item?.Name}</Text>
      <Text className="text-center opacity-50">{item?.ProductionYear}</Text>
    </View>
  );
};
