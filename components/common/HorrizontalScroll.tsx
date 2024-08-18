import React, { useEffect } from "react";
import { ScrollView, ScrollViewProps, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Loader } from "../Loader";
import { Text } from "./Text";

interface HorizontalScrollProps<T> extends ScrollViewProps {
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

  return (
    <ScrollView
      horizontal
      style={containerStyle}
      contentContainerStyle={contentContainerStyle}
      showsHorizontalScrollIndicator={false}
      {...props}
    >
      <Animated.View
        className={`
        flex flex-row px-4
      `}
        style={[animatedStyle1]}
      >
        {data.map((item, index) => (
          <View className="mr-2" key={index}>
            <React.Fragment>{renderItem(item, index)}</React.Fragment>
          </View>
        ))}
        {data.length === 0 && (
          <View className="flex-1 justify-center items-center">
            <Text className="text-center text-gray-500">No data available</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}
