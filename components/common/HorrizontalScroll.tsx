import { FlashList, FlashListProps } from "@shopify/flash-list";
import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Loader } from "../Loader";
import { Text } from "./Text";

type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

interface HorizontalScrollProps<T>
  extends PartialExcept<
    Omit<FlashListProps<T>, "renderItem">,
    "estimatedItemSize"
  > {
  data?: T[] | null;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  loadingContainerStyle?: ViewStyle;
  height?: number;
  loading?: boolean;
}

export function HorizontalScroll<T>({
  data = [],
  renderItem,
  containerStyle,
  contentContainerStyle,
  loadingContainerStyle,
  loading = false,
  height = 164,
  ...props
}: HorizontalScrollProps<T>): React.ReactElement {
  const animatedOpacity = useSharedValue(0);
  const animatedStyle1 = useAnimatedStyle(() => {
    return {
      opacity: withTiming(animatedOpacity.value, { duration: 250 }),
    };
  });

  useEffect(() => {
    if (data) {
      animatedOpacity.value = 1;
    }
  }, [data]);

  if (data === undefined || data === null || loading) {
    return (
      <View
        style={[
          {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          },
          loadingContainerStyle,
        ]}
      >
        <Loader />
      </View>
    );
  }

  const renderFlashListItem = ({ item, index }: { item: T; index: number }) => (
    <View className="mr-2">
      <React.Fragment>{renderItem(item, index)}</React.Fragment>
    </View>
  );

  return (
    <Animated.View style={[containerStyle, animatedStyle1]}>
      <FlashList
        data={data}
        renderItem={renderFlashListItem}
        horizontal
        estimatedItemSize={100}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          ...contentContainerStyle,
        }}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center">
            <Text className="text-center text-gray-500">No data available</Text>
          </View>
        )}
        {...props}
      />
    </Animated.View>
  );
}
