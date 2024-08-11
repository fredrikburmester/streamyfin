import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { PropsWithChildren, ReactElement } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 400;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  logo?: ReactElement;
}>;

export const ParallaxScrollView: React.FC<Props> = ({
  children,
  headerImage,
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
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1],
          ),
        },
      ],
    };
  });

  const inset = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <Animated.ScrollView
        style={{
          position: "relative",
        }}
        ref={scrollRef}
        scrollEventThrottle={16}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 z-50 bg-black rounded-full p-2 border border-neutral-900"
          style={{
            top: inset.top + 17,
          }}
        >
          <Ionicons
            className="drop-shadow-2xl"
            name="arrow-back"
            size={24}
            color="#077DF2"
          />
        </TouchableOpacity>

        {logo && (
          <View className="absolute top-[250px] h-[130px] left-0 w-full z-40 px-4 flex justify-center items-center">
            {logo}
          </View>
        )}

        <Animated.View
          style={[
            {
              height: HEADER_HEIGHT,
              backgroundColor: "black",
            },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}
        </Animated.View>
        <View className="flex-1 overflow-hidden bg-black">{children}</View>
      </Animated.ScrollView>
    </View>
  );
};
