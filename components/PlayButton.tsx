import { usePlayback } from "@/providers/PlaybackProvider";
import { runtimeTicksToMinutes } from "@/utils/time";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import CastContext, {
  PlayServicesState,
  useRemoteMediaClient,
} from "react-native-google-cast";
import { Button } from "./Button";
import { Text } from "./common/Text";
import { useAtom } from "jotai";
import { itemThemeColorAtom } from "@/utils/atoms/primaryColor";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";

interface Props extends React.ComponentProps<typeof Button> {
  item?: BaseItemDto | null;
  url?: string | null;
}

export const PlayButton: React.FC<Props> = ({ item, url, ...props }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const client = useRemoteMediaClient();
  const { setCurrentlyPlayingState } = usePlayback();

  const [color] = useAtom(itemThemeColorAtom);

  // Create a shared value for animation progress
  const progress = useSharedValue(0);

  // Create shared values for start and end colors
  const startColor = useSharedValue(color);
  const endColor = useSharedValue(color);

  useEffect(() => {
    // When color changes, update end color and animate progress
    endColor.value = color;
    progress.value = 0; // Reset progress
    progress.value = withTiming(1, { duration: 300 }); // Animate to 1 over 500ms
  }, [color]);

  // Animated style for primary color
  const animatedPrimaryStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [startColor.value.average, endColor.value.average]
    ),
  }));

  // Animated style for text color
  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [startColor.value.text, endColor.value.text]
    ),
  }));

  // Update start color after animation completes
  useEffect(() => {
    const timeout = setTimeout(() => {
      startColor.value = color;
    }, 500); // Should match the duration in withTiming

    return () => clearTimeout(timeout);
  }, [color]);

  const onPress = async () => {
    if (!url || !item) return;

    if (!client) {
      setCurrentlyPlayingState({ item, url });
      return;
    }

    const options = ["Chromecast", "Device", "Cancel"];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (selectedIndex: number | undefined) => {
        switch (selectedIndex) {
          case 0:
            await CastContext.getPlayServicesState().then((state) => {
              if (state && state !== PlayServicesState.SUCCESS)
                CastContext.showPlayServicesErrorDialog(state);
              else {
                client.loadMedia({
                  mediaInfo: {
                    contentUrl: url,
                    contentType: "video/mp4",
                    metadata: {
                      type: item.Type === "Episode" ? "tvShow" : "movie",
                      title: item.Name || "",
                      subtitle: item.Overview || "",
                    },
                  },
                  startTime: 0,
                });
              }
            });
            break;
          case 1:
            setCurrentlyPlayingState({ item, url });
            break;
          case cancelButtonIndex:
            break;
        }
      }
    );
  };

  const playbackPercent = useMemo(() => {
    if (!item || !item.RunTimeTicks) return 0;
    const userData = item.UserData;
    if (!userData) return 0;
    const PlaybackPositionTicks = userData.PlaybackPositionTicks;
    if (!PlaybackPositionTicks) return 0;
    return (PlaybackPositionTicks / item.RunTimeTicks) * 100;
  }, [item]);

  return (
    <TouchableOpacity onPress={onPress} className="relative" {...props}>
      <Animated.View
        style={[
          animatedPrimaryStyle,
          {
            width:
              playbackPercent === 0
                ? "100%"
                : `${Math.max(playbackPercent, 15)}%`,
            height: "100%",
          },
        ]}
        className="absolute w-full h-full top-0 left-0 rounded-xl z-10"
      />
      <Animated.View
        style={[animatedPrimaryStyle]}
        className="absolute w-full h-full top-0 left-0 rounded-xl "
      />
      <View
        style={{
          borderWidth: 1,
          borderColor: color.primary,
          borderStyle: "solid",
        }}
        className="flex flex-row items-center justify-center bg-transparent rounded-xl z-20 h-12 w-full "
      >
        <View className="flex flex-row items-center space-x-2">
          <Animated.Text style={[animatedTextStyle, { fontWeight: "bold" }]}>
            {runtimeTicksToMinutes(item?.RunTimeTicks)}
          </Animated.Text>
          <Animated.Text style={animatedTextStyle}>
            <Ionicons name="play-circle" size={24} />
          </Animated.Text>
          {client && (
            <Animated.Text style={animatedTextStyle}>
              <Feather name="cast" size={22} />
            </Animated.Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
