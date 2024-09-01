import { usePlayback } from "@/providers/PlaybackProvider";
import { itemThemeColorAtom } from "@/utils/atoms/primaryColor";
import { runtimeTicksToMinutes } from "@/utils/time";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import CastContext, {
  PlayServicesState,
  useRemoteMediaClient,
  useMediaStatus,
} from "react-native-google-cast";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button } from "./Button";
import { isCancel } from "axios";

interface Props extends React.ComponentProps<typeof Button> {
  item?: BaseItemDto | null;
  url?: string | null;
}

const ANIMATION_DURATION = 500;
const MIN_PLAYBACK_WIDTH = 15;

export const PlayButton: React.FC<Props> = ({ item, url, ...props }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const client = useRemoteMediaClient();
  const { setCurrentlyPlayingState } = usePlayback();
  const mediaStatus = useMediaStatus();

  const [colorAtom] = useAtom(itemThemeColorAtom);

  const memoizedItem = useMemo(() => item, [item?.Id]); // Memoize the item
  const memoizedColor = useMemo(() => colorAtom, [colorAtom]); // Memoize the color

  const startWidth = useSharedValue(0);
  const targetWidth = useSharedValue(0);
  const endColor = useSharedValue(memoizedColor);
  const startColor = useSharedValue(memoizedColor);
  const widthProgress = useSharedValue(0);
  const colorChangeProgress = useSharedValue(0);

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
        const currentTitle = mediaStatus?.mediaInfo?.metadata?.title;
        const isOpeningCurrentlyPlayingMedia =
          currentTitle && currentTitle === item?.Name;

        switch (selectedIndex) {
          case 0:
            await CastContext.getPlayServicesState().then((state) => {
              if (state && state !== PlayServicesState.SUCCESS)
                CastContext.showPlayServicesErrorDialog(state);
              else {
                // If we're opening a currently playing item, don't restart the media.
                // Instead just open controls.
                if (isOpeningCurrentlyPlayingMedia) {
                  CastContext.showExpandedControls();
                  return;
                }
                client
                  .loadMedia({
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
                  })
                  .then(() => {
                    // state is already set when reopening current media, so skip it here.
                    if (isOpeningCurrentlyPlayingMedia) {
                      return;
                    }
                    setCurrentlyPlayingState({ item, url });
                    CastContext.showExpandedControls();
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

  const derivedTargetWidth = useDerivedValue(() => {
    if (!memoizedItem || !memoizedItem.RunTimeTicks) return 0;
    const userData = memoizedItem.UserData;
    if (userData && userData.PlaybackPositionTicks) {
      return userData.PlaybackPositionTicks > 0
        ? Math.max(
            (userData.PlaybackPositionTicks / memoizedItem.RunTimeTicks) * 100,
            MIN_PLAYBACK_WIDTH
          )
        : 0;
    }
    return 0;
  }, [memoizedItem]);

  useAnimatedReaction(
    () => derivedTargetWidth.value,
    (newWidth) => {
      targetWidth.value = newWidth;
      widthProgress.value = 0;
      widthProgress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.7, 0, 0.3, 1.0),
      });
    },
    [item]
  );

  useAnimatedReaction(
    () => memoizedColor,
    (newColor) => {
      endColor.value = newColor;
      colorChangeProgress.value = 0;
      colorChangeProgress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.9, 0, 0.31, 0.99),
      });
    },
    [memoizedColor]
  );

  useEffect(() => {
    const timeout_2 = setTimeout(() => {
      startColor.value = memoizedColor;
      startWidth.value = targetWidth.value;
    }, ANIMATION_DURATION);

    return () => {
      clearTimeout(timeout_2);
    };
  }, [memoizedColor, memoizedItem]);

  /**
   * ANIMATED STYLES
   */
  const animatedAverageStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorChangeProgress.value,
      [0, 1],
      [startColor.value.average, endColor.value.average]
    ),
  }));

  const animatedPrimaryStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorChangeProgress.value,
      [0, 1],
      [startColor.value.primary, endColor.value.primary]
    ),
  }));

  const animatedWidthStyle = useAnimatedStyle(() => ({
    width: `${interpolate(
      widthProgress.value,
      [0, 1],
      [startWidth.value, targetWidth.value]
    )}%`,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorChangeProgress.value,
      [0, 1],
      [startColor.value.text, endColor.value.text]
    ),
  }));
  /**
   * *********************
   */

  return (
    <TouchableOpacity
      accessibilityLabel="Play button"
      accessibilityHint="Tap to play the media"
      onPress={onPress}
      className="relative"
      {...props}
    >
      <View className="absolute w-full h-full top-0 left-0 rounded-xl z-10 overflow-hidden">
        <Animated.View
          style={[
            animatedPrimaryStyle,
            animatedWidthStyle,
            {
              height: "100%",
            },
          ]}
        />
      </View>

      <Animated.View
        style={[animatedAverageStyle]}
        className="absolute w-full h-full top-0 left-0 rounded-xl"
      />
      <View
        style={{
          borderWidth: 1,
          borderColor: colorAtom.primary,
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
