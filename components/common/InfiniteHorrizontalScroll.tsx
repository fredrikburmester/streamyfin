import React, { useEffect } from "react";
import {
  NativeScrollEvent,
  ScrollView,
  ScrollViewProps,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Loader } from "../Loader";
import { Text } from "./Text";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
} from "@jellyfin/sdk/lib/generated-client/models";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useNavigation } from "expo-router";
import { useAtom } from "jotai";

interface HorizontalScrollProps extends ScrollViewProps {
  queryFn: ({
    pageParam,
  }: {
    pageParam: number;
  }) => Promise<BaseItemDtoQueryResult | null>;
  queryKey: string[];
  initialData?: BaseItemDto[];
  renderItem: (item: BaseItemDto, index: number) => React.ReactNode;
  containerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  loadingContainerStyle?: ViewStyle;
  height?: number;
  loading?: boolean;
}

const isCloseToBottom = ({
  layoutMeasurement,
  contentOffset,
  contentSize,
}: NativeScrollEvent) => {
  const paddingToBottom = 50;
  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
};

export function InfiniteHorizontalScroll({
  queryFn,
  queryKey,
  initialData = [],
  renderItem,
  containerStyle,
  contentContainerStyle,
  loadingContainerStyle,
  loading = false,
  height = 164,
  ...props
}: HorizontalScrollProps): React.ReactElement {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const navigation = useNavigation();

  const animatedOpacity = useSharedValue(0);
  const animatedStyle1 = useAnimatedStyle(() => {
    return {
      opacity: withTiming(animatedOpacity.value, { duration: 250 }),
    };
  });

  const { data, isFetching, fetchNextPage } = useInfiniteQuery({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage, pages) => {
      if (
        !lastPage?.Items ||
        !lastPage?.TotalRecordCount ||
        lastPage?.TotalRecordCount === 0
      )
        return undefined;

      const totalItems = lastPage.TotalRecordCount;
      const accumulatedItems = pages.reduce(
        (acc, curr) => acc + (curr?.Items?.length || 0),
        0
      );

      if (accumulatedItems < totalItems) {
        return lastPage?.Items?.length * pages.length;
      } else {
        return undefined;
      }
    },
    initialPageParam: 0,
    enabled: !!api && !!user?.Id,
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
      onScroll={({ nativeEvent }) => {
        if (isCloseToBottom(nativeEvent)) {
          fetchNextPage();
        }
      }}
      scrollEventThrottle={400}
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
        {data?.pages
          .flatMap((page) => page?.Items)
          .map(
            (item, index) =>
              item && (
                <View className="mr-2" key={index}>
                  <React.Fragment>{renderItem(item, index)}</React.Fragment>
                </View>
              )
          )}
        {data?.pages.flatMap((page) => page?.Items).length === 0 && (
          <View className="flex-1 justify-center items-center">
            <Text className="text-center text-gray-500">No data available</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}
