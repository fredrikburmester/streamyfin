import { Text } from "@/components/common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useRouter } from "expo-router";
import { TouchableOpacity, View, ViewProps } from "react-native";

interface Props extends ViewProps {
  item: BaseItemDto;
}

export const EpisodeTitleHeader: React.FC<Props> = ({ item, ...props }) => {
  const router = useRouter();

  return (
    <View {...props} className="flex flex-col">
      <TouchableOpacity
        onPress={() => router.push(`/(auth)/series/${item.SeriesId}`)}
      >
        <Text className="text-center opacity-50">{item?.SeriesName}</Text>
      </TouchableOpacity>
      <Text className="text-center font-bold text-2xl">{item?.Name}</Text>
      <View className="flex flex-row items-center self-center">
        <TouchableOpacity
          onPress={() => {
            router.push(
              // @ts-ignore
              `/(auth)/series/${item.SeriesId}?seasonIndex=${item?.ParentIndexNumber}`
            );
          }}
        >
          <Text className="text-center opacity-50">{item?.SeasonName}</Text>
        </TouchableOpacity>
        <Text className="text-center opacity-50 mx-2">{"—"}</Text>
        <Text className="text-center opacity-50">
          {`Episode ${item.IndexNumber}`}
        </Text>
      </View>
      <Text className="text-center opacity-50">{item?.ProductionYear}</Text>
    </View>
  );
};
