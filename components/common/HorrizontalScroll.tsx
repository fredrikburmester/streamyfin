import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  ViewStyle,
  ActivityIndicator,
  ScrollViewProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface HorizontalScrollProps<T> extends ScrollViewProps {
  data?: T[] | null;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  loadingContainerStyle?: ViewStyle;
  height?: number;
}

export function HorizontalScroll<T>({
  data,
  renderItem,
  containerStyle,
  contentContainerStyle,
  loadingContainerStyle,
  height = 164,
  ...props
}: HorizontalScrollProps<T>): React.ReactElement {
  if (!data) {
    return (
      <View
        style={[
          {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            height,
          },
          loadingContainerStyle,
        ]}
      >
        <ActivityIndicator size="small" />
      </View>
    );
  }

  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, { duration: 250 }),
    };
  });

  useEffect(() => {
    if (data && data.length > 0) opacity.value = 1;
  }, [data]);

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
        style={[animatedStyle]}
      >
        {data?.map((item, index) => (
          <View className="mr-2" key={index}>
            <React.Fragment>{renderItem(item, index)}</React.Fragment>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}
