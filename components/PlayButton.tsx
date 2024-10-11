import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { itemThemeColorAtom } from "@/utils/atoms/primaryColor";
import { getParentBackdropImageUrl } from "@/utils/jellyfin/image/getParentBackdropImageUrl";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";
import { runtimeTicksToMinutes } from "@/utils/time";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { Alert, Linking, TouchableOpacity, View } from "react-native";
import CastContext, {
  CastButton,
  PlayServicesState,
  useMediaStatus,
  useRemoteMediaClient,
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
import { Text } from "./common/Text";
import { useRouter } from "expo-router";
import { useSettings } from "@/utils/atoms/settings";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { chromecastProfile } from "@/utils/profiles/chromecast";
import { usePlaySettings } from "@/providers/PlaySettingsProvider";

interface Props extends React.ComponentProps<typeof Button> {}

const ANIMATION_DURATION = 500;
const MIN_PLAYBACK_WIDTH = 15;

export const PlayButton: React.FC<Props> = ({ ...props }) => {
  const { playSettings, playUrl: url } = usePlaySettings();
  const { showActionSheetWithOptions } = useActionSheet();
  const client = useRemoteMediaClient();
  const mediaStatus = useMediaStatus();

  const [colorAtom] = useAtom(itemThemeColorAtom);
  const api = useAtomValue(apiAtom);
  const user = useAtomValue(userAtom);

  const router = useRouter();

  const startWidth = useSharedValue(0);
  const targetWidth = useSharedValue(0);
  const endColor = useSharedValue(colorAtom);
  const startColor = useSharedValue(colorAtom);
  const widthProgress = useSharedValue(0);
  const colorChangeProgress = useSharedValue(0);
  const [settings] = useSettings();

  const directStream = useMemo(() => {
    return !url?.includes("m3u8");
  }, [url]);

  const item = useMemo(() => {
    return playSettings?.item;
  }, [playSettings?.item]);

  const onPress = useCallback(async () => {
    if (!url || !item) {
      console.warn(
        "No URL or item provided to PlayButton",
        url?.slice(0, 100),
        item?.Id
      );
      return;
    }

    if (!client) {
      const vlcLink = "vlc://" + url;
      if (vlcLink && settings?.openInVLC) {
        Linking.openURL(vlcLink);
        return;
      }

      router.push("/play-video");
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
        if (!api) return;
        const currentTitle = mediaStatus?.mediaInfo?.metadata?.title;
        const isOpeningCurrentlyPlayingMedia =
          currentTitle && currentTitle === item?.Name;

        switch (selectedIndex) {
          case 0:
            await CastContext.getPlayServicesState().then(async (state) => {
              if (state && state !== PlayServicesState.SUCCESS)
                CastContext.showPlayServicesErrorDialog(state);
              else {
                // If we're opening a currently playing item, don't restart the media.
                // Instead just open controls.
                if (isOpeningCurrentlyPlayingMedia) {
                  CastContext.showExpandedControls();
                  return;
                }

                // Get a new URL with the Chromecast device profile:
                const data = await getStreamUrl({
                  api,
                  deviceProfile: chromecastProfile,
                  item,
                  mediaSourceId: playSettings?.mediaSource?.Id,
                  startTimeTicks: 0,
                  maxStreamingBitrate: playSettings?.bitrate?.value,
                  audioStreamIndex: playSettings?.audioIndex ?? 0,
                  subtitleStreamIndex: playSettings?.subtitleIndex ?? -1,
                  userId: user?.Id,
                  forceDirectPlay: settings?.forceDirectPlay,
                });

                if (!data?.url) {
                  console.warn("No URL returned from getStreamUrl", data);
                  Alert.alert(
                    "Client error",
                    "Could not create stream for Chromecast"
                  );
                  return;
                }

                client
                  .loadMedia({
                    mediaInfo: {
                      contentUrl: data?.url,
                      contentType: "video/mp4",
                      metadata:
                        item.Type === "Episode"
                          ? {
                              type: "tvShow",
                              title: item.Name || "",
                              episodeNumber: item.IndexNumber || 0,
                              seasonNumber: item.ParentIndexNumber || 0,
                              seriesTitle: item.SeriesName || "",
                              images: [
                                {
                                  url: getParentBackdropImageUrl({
                                    api,
                                    item,
                                    quality: 90,
                                    width: 2000,
                                  })!,
                                },
                              ],
                            }
                          : item.Type === "Movie"
                          ? {
                              type: "movie",
                              title: item.Name || "",
                              subtitle: item.Overview || "",
                              images: [
                                {
                                  url: getPrimaryImageUrl({
                                    api,
                                    item,
                                    quality: 90,
                                    width: 2000,
                                  })!,
                                },
                              ],
                            }
                          : {
                              type: "generic",
                              title: item.Name || "",
                              subtitle: item.Overview || "",
                              images: [
                                {
                                  url: getPrimaryImageUrl({
                                    api,
                                    item,
                                    quality: 90,
                                    width: 2000,
                                  })!,
                                },
                              ],
                            },
                    },
                    startTime: 0,
                  })
                  .then(() => {
                    // state is already set when reopening current media, so skip it here.
                    if (isOpeningCurrentlyPlayingMedia) {
                      return;
                    }
                    CastContext.showExpandedControls();
                  });
              }
            });
            break;
          case 1:
            router.push("/play-video");
            break;
          case cancelButtonIndex:
            break;
        }
      }
    );
  }, [
    url,
    item,
    client,
    settings,
    api,
    user,
    playSettings,
    router,
    showActionSheetWithOptions,
    mediaStatus,
  ]);

  const derivedTargetWidth = useDerivedValue(() => {
    if (!item || !item.RunTimeTicks) return 0;
    const userData = item.UserData;
    if (userData && userData.PlaybackPositionTicks) {
      return userData.PlaybackPositionTicks > 0
        ? Math.max(
            (userData.PlaybackPositionTicks / item.RunTimeTicks) * 100,
            MIN_PLAYBACK_WIDTH
          )
        : 0;
    }
    return 0;
  }, [item]);

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
    () => colorAtom,
    (newColor) => {
      endColor.value = newColor;
      colorChangeProgress.value = 0;
      colorChangeProgress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.9, 0, 0.31, 0.99),
      });
    },
    [colorAtom]
  );

  useEffect(() => {
    const timeout_2 = setTimeout(() => {
      startColor.value = colorAtom;
      startWidth.value = targetWidth.value;
    }, ANIMATION_DURATION);

    return () => {
      clearTimeout(timeout_2);
    };
  }, [colorAtom, item]);

  /**
   * ANIMATED STYLES
   */
  const animatedAverageStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorChangeProgress.value,
      [0, 1],
      [startColor.value.primary, endColor.value.primary]
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
    <View>
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
          style={[animatedAverageStyle, { opacity: 0.5 }]}
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
                <CastButton tintColor="transparent" />
              </Animated.Text>
            )}
            {!client && settings?.openInVLC && (
              <Animated.Text style={animatedTextStyle}>
                <MaterialCommunityIcons
                  name="vlc"
                  size={18}
                  color={animatedTextStyle.color}
                />
              </Animated.Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <View className="mt-2 flex flex-row items-center">
        <Ionicons
          name="information-circle"
          size={12}
          className=""
          color={"#9BA1A6"}
        />
        <Text className="text-neutral-500 ml-1">
          {directStream ? "Direct stream" : "Transcoded stream"}
        </Text>
      </View>
    </View>
  );
};
