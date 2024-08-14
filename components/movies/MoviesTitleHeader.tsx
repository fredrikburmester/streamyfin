import { TouchableOpacity, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { useRouter } from "expo-router";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface Props extends ViewProps {
  item: BaseItemDto;
}

export const MoviesTitleHeader: React.FC<Props> = ({ item, ...props }) => {
  const router = useRouter();
  return (
    <>
      <View className="flex flex-row items-center self-center px-4">
        <Text className="text-center font-bold text-2xl mr-2">
          {item?.Name}
        </Text>
      </View>
    </>
  );
};
