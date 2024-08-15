import { TouchableOpacity, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { useRouter } from "expo-router";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface Props extends ViewProps {
  item: BaseItemDto;
}

export const SeriesTitleHeader: React.FC<Props> = ({ item, ...props }) => {
  const router = useRouter();
  return (
    <>
      <TouchableOpacity
        onPress={() => router.push(`/(auth)/series/${item.SeriesId}`)}
      >
        <Text className="text-center opacity-50">{item?.SeriesName}</Text>
      </TouchableOpacity>
      <View className="flex flex-row items-center self-center px-4">
        <Text className="text-center font-bold text-2xl mr-2">
          {item?.Name}
        </Text>
      </View>
      <View>
        <View className="flex flex-row items-center self-center">
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-center opacity-50">{item?.SeasonName}</Text>
          </TouchableOpacity>
          <Text className="text-center opacity-50 mx-2">{"—"}</Text>
          <Text className="text-center opacity-50">
            {`Episode ${item.IndexNumber}`}
          </Text>
        </View>
      </View>
    </>
  );
};
