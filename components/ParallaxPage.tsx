import { type PropsWithChildren, type ReactElement } from "react";
import { View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  logo?: ReactElement;
  episodePoster?: ReactElement;
  headerHeight?: number;
}>;

export const ParallaxScrollView: React.FC<Props> = ({
  children,
  headerImage,
  episodePoster,
  headerHeight = 400,
  logo,
}: Props) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [-headerHeight / 2, 0, headerHeight * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <View className="flex-1">
      <Animated.ScrollView
        style={{
          position: "relative",
        }}
        ref={scrollRef}
        scrollEventThrottle={16}
      >
        {logo && (
          <View
            style={{
              top: headerHeight - 150,
              height: 130,
            }}
            className="absolute left-0 w-full z-40 px-4 flex justify-center items-center"
          >
            {logo}
          </View>
        )}

        {episodePoster && (
          <View className="absolute top-[290px] h-[120px] w-full left-0 flex justify-center items-center z-50">
            <View className="h-full aspect-video border border-neutral-800">
              {episodePoster}
            </View>
          </View>
        )}

        <Animated.View
          style={[
            {
              height: headerHeight,
              backgroundColor: "black",
            },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}
        </Animated.View>

        <View className="flex-1 overflow-hidden bg-black pb-24">
          {children}
        </View>
      </Animated.ScrollView>
    </View>
  );
};
