import { apiAtom } from "@/providers/JellyfinProvider";
import { usePlayback } from "@/providers/PlaybackProvider";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { writeToLog } from "@/utils/log";
import { runtimeTicksToMinutes, runtimeTicksToSeconds } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter, useSegments } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import { Slider } from "react-native-awesome-slider";
import "react-native-gesture-handler";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import { Text } from "./common/Text";
import { Loader } from "./Loader";

const PADDING = 8;
const BAR_HEIGHT = 70;
const CONTENT_HEIGHT = BAR_HEIGHT - PADDING * 2;
const COLORS = ["#262626", "#000000"];

export const CurrentlyPlayingBar: React.FC = () => {
  const segments = useSegments();
  const {
    currentlyPlaying,
    pauseVideo,
    playVideo,
    stopPlayback,
    setVolume,
    setIsPlaying,
    isPlaying,
    videoRef,
    presentFullscreenPlayer,
    onProgress,
  } = usePlayback();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [api] = useAtom(apiAtom);

  const [size, setSize] = useState<"full" | "small">("small");
  const animationProgress = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);

  const screenHeight = Dimensions.get("window").height;
  const screenWiidth = Dimensions.get("window").width;

  const BOTTOM_HEIGHT = useMemo(() => insets.bottom + 48, [insets.bottom]);
  const from = useMemo(() => segments[2], [segments]);

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    return {
      bottom: interpolate(progress, [0, 1], [BOTTOM_HEIGHT, 0]),
      width: interpolate(
        progress,
        [0, 1],
        [screenWiidth - PADDING * 2 - insets.left - insets.right, screenWiidth]
      ),
      height: interpolate(progress, [0, 1], [BAR_HEIGHT, screenHeight]),
      padding: interpolate(progress, [0, 1], [PADDING, 0]),
      left: interpolate(progress, [0, 1], [insets.left + PADDING, 0]),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    return {
      bottom: interpolate(
        progress,
        [0, 1],
        [BOTTOM_HEIGHT, insets.bottom + PADDING * 5]
      ),
      left: interpolate(
        progress,
        [0, 1],
        [
          (CONTENT_HEIGHT * 16) / 9 + 16 + 8 + insets.left,
          PADDING * 4 + insets.left,
        ]
      ),
      height: interpolate(progress, [0, 1], [BAR_HEIGHT, 64]),
      width: interpolate(progress, [0, 1], [140, 140]),
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    return {
      bottom: interpolate(
        progress,
        [0, 1],
        [BOTTOM_HEIGHT, screenHeight - insets.top - insets.bottom - PADDING * 5]
      ),
      right: interpolate(
        progress,
        [0, 1],
        [16 + insets.right, 16 + insets.right + PADDING]
      ),
      height: interpolate(progress, [0, 1], [BAR_HEIGHT, BAR_HEIGHT]),
    };
  });

  const animatedVideoStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    return {
      bottom: interpolate(progress, [0, 1], [BOTTOM_HEIGHT + PADDING, 0]),
      height: interpolate(progress, [0, 1], [CONTENT_HEIGHT, screenHeight]),
      width: interpolate(
        progress,
        [0, 1],
        [(CONTENT_HEIGHT * 16) / 9, screenWiidth - insets.right - insets.left]
      ),
      left: interpolate(
        progress,
        [0, 1],
        [PADDING * 2 + insets.left, insets.left]
      ),
      opacity:
        size === "small"
          ? 1
          : interpolate(
              controlsOpacity.value,
              [0, 1],
              [1, 0.5] // 100% opacity when controls are hidden, 50% when visible
            ),
    };
  });

  const animatedColorStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    return {
      backgroundColor: interpolateColor(
        progress,
        [0, 1],
        [COLORS[0], COLORS[1]]
      ),
    };
  });

  const animatedSliderStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    return {
      opacity: interpolate(progress, [0, 0.1], [0, 1]),
      display: progress > 0 ? "flex" : "none",
    };
  });

  const showControls = () => {
    controlsOpacity.value = withTiming(1, { duration: 300 });
  };

  const hideControls = () => {
    controlsOpacity.value = withTiming(0, { duration: 300 });
  };

  const animatedControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: controlsOpacity.value,
    };
  });

  // const PAN_GESTURE_EXTENT = screenHeight * 4; // Adjust this value as needed
  // const panGesture = Gesture.Pan()
  //   .onStart(() => {
  //     animationProgress.value = size === "small" ? 0 : 1;
  //   })
  //   .onUpdate((event) => {
  //     const delta = -event.translationY / PAN_GESTURE_EXTENT;
  //     const newProgress = animationProgress.value + delta;
  //     animationProgress.value = Math.max(0, Math.min(1, newProgress));
  //   })
  //   .onEnd(() => {
  //     if (animationProgress.value > 0.5) {
  //       animationProgress.value = withTiming(1, { duration: 300 });
  //       size = "full";
  //     } else {
  //       animationProgress.value = withTiming(0, { duration: 300 });
  //       size = "small";
  //     }
  //   });

  const poster = useMemo(() => {
    if (currentlyPlaying?.item.Type === "Audio")
      return `${api?.basePath}/Items/${currentlyPlaying.item.AlbumId}/Images/Primary?tag=${currentlyPlaying.item.AlbumPrimaryImageTag}&quality=90&maxHeight=200&maxWidth=200`;
    else
      return getBackdropUrl({
        api,
        item: currentlyPlaying?.item,
        quality: 70,
        width: 200,
      });
  }, [currentlyPlaying?.item.Id, api]);

  const startPosition = useMemo(
    () =>
      currentlyPlaying?.item?.UserData?.PlaybackPositionTicks
        ? Math.round(
            currentlyPlaying?.item.UserData.PlaybackPositionTicks / 10000
          )
        : 0,
    [currentlyPlaying?.item]
  );

  const videoSource = useMemo(() => {
    if (!api || !currentlyPlaying || !poster) return null;
    return {
      uri: currentlyPlaying.url,
      isNetwork: true,
      startPosition,
      headers: getAuthHeaders(api),
      metadata: {
        artist: currentlyPlaying.item?.AlbumArtist
          ? currentlyPlaying.item?.AlbumArtist
          : undefined,
        title: currentlyPlaying.item?.Name || "Unknown",
        description: currentlyPlaying.item?.Overview
          ? currentlyPlaying.item?.Overview
          : undefined,
        imageUri: poster,
        subtitle: currentlyPlaying.item?.Album
          ? currentlyPlaying.item?.Album
          : undefined,
      },
    };
  }, [currentlyPlaying, startPosition, api, poster]);

  // useEffect(() => {
  //   const BOTTOM_HEIGHT = insets.bottom + 48;

  //   backgroundValues.value = {
  //     bottom: interpolate(animationProgress.value, [0, 1], [BOTTOM_HEIGHT, 0]),
  //     height: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [BAR_HEIGHT, screenHeight]
  //     ),
  //     padding: interpolate(animationProgress.value, [0, 1], [PADDING, 0]),
  //     width: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [screenWiidth - PADDING * 2, screenWiidth]
  //     ),
  //     left: interpolate(animationProgress.value, [0, 1], [8, 0]),
  //   };

  //   buttonsValues.value = {
  //     bottom: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [BOTTOM_HEIGHT, screenHeight - insets.top - 48]
  //     ),
  //     right: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [16, 16 + insets.right]
  //     ),
  //     height: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [BAR_HEIGHT, BAR_HEIGHT]
  //     ),
  //   };

  //   videoValues.value = {
  //     bottom: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [BOTTOM_HEIGHT + PADDING, 0]
  //     ),
  //     height: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [CONTENT_HEIGHT, screenHeight]
  //     ),
  //     width: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [(CONTENT_HEIGHT * 16) / 9, screenWiidth - insets.right - insets.left]
  //     ),
  //     left: interpolate(animationProgress.value, [0, 1], [16, insets.left]),
  //   };

  //   textValues.value = {
  //     bottom: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [BOTTOM_HEIGHT, BOTTOM_HEIGHT]
  //     ),
  //     height: interpolate(animationProgress.value, [0, 1], [BAR_HEIGHT, 64]),
  //     left: interpolate(
  //       animationProgress.value,
  //       [0, 1],
  //       [(CONTENT_HEIGHT * 16) / 9 + 16 + 8, PADDING * 2 + insets.left]
  //     ),
  //     width: interpolate(animationProgress.value, [0, 1], [140, 140]),
  //   };

  //   colorProgress.value = withTiming(animationProgress.value, {
  //     duration: 500,
  //   });
  // }, [
  //   animationProgress.value,
  //   screenHeight,
  //   screenWiidth,
  //   insets.bottom,
  //   insets.top,
  //   insets.right,
  //   insets.left,
  //   controlsVisible,
  // ]);

  const progress = useSharedValue(0);
  const min = useSharedValue(0);
  const max = useSharedValue(currentlyPlaying?.item.RunTimeTicks || 0);
  const sliding = useRef(false);

  useEffect(() => {
    max.value = currentlyPlaying?.item.RunTimeTicks || 0;
  }, [currentlyPlaying?.item.RunTimeTicks]);

  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showControlsAndResetTimer = () => {
    showControls();
    if (size === "full") {
      resetHideControlsTimer();
    }
  };

  const resetHideControlsTimer = () => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      hideControls();
    }, 3000);
  };

  useEffect(() => {
    if (size === "full" && controlsOpacity.value > 0) {
      resetHideControlsTimer();
    }

    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [controlsOpacity.value, size]);

  if (!api || !currentlyPlaying) return null;

  return (
    <View>
      <View>
        <Animated.View
          className={`rounded-lg absolute`}
          style={[animatedBackgroundStyle, animatedColorStyle]}
        ></Animated.View>

        <Animated.View
          className={`absolute z-10`}
          style={[animatedTextStyle, animatedControlsStyle]}
        >
          <View className="shrink flex flex-col justify-center h-full">
            <TouchableOpacity
              onPress={() => {
                if (currentlyPlaying.item?.Type === "Audio") {
                  router.push(
                    // @ts-ignore
                    `/(auth)/(tabs)/${from}/albums/${currentlyPlaying.item.AlbumId}`
                  );
                } else {
                  router.push(
                    // @ts-ignore
                    `/(auth)/(tabs)/${from}/items/page?id=${currentlyPlaying.item?.Id}`
                  );
                }
              }}
            >
              <Text className="text-xs">{currentlyPlaying.item?.Name}</Text>
            </TouchableOpacity>
            {currentlyPlaying.item?.Type === "Episode" && (
              <TouchableOpacity
                onPress={() => {
                  router.push(
                    // @ts-ignore
                    `/(auth)/(tabs)/${from}/series/${currentlyPlaying.item.SeriesId}`
                  );
                }}
              >
                <Text className="text-xs opacity-50">
                  {currentlyPlaying.item.SeriesName}
                </Text>
              </TouchableOpacity>
            )}
            {currentlyPlaying.item?.Type === "Movie" && (
              <Text className="text-xs opacity-50">
                {currentlyPlaying.item?.ProductionYear}
              </Text>
            )}
            {currentlyPlaying.item?.Type === "Audio" && (
              <TouchableOpacity
                onPress={() => {
                  router.push(`/albums/${currentlyPlaying.item?.AlbumId}`);
                }}
              >
                <Text className="text-xs opacity-50">
                  {currentlyPlaying.item?.Album}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <Animated.View
          className={`absolute z-10`}
          style={[animatedButtonStyle, animatedControlsStyle]}
        >
          <View className="flex flex-row items-center h-full">
            <TouchableOpacity
              onPress={() => {
                if (size === "small") {
                  animationProgress.value = withTiming(1, { duration: 300 });
                  setSize("full");
                  hideControls();
                } else {
                  animationProgress.value = withTiming(0, { duration: 300 });
                  setSize("small");
                  showControls();
                }
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              <Ionicons name="expand" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (isPlaying) {
                  pauseVideo();
                } else {
                  playVideo();
                }
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                stopPlayback();
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={[animatedVideoStyle]}
          className={` rounded-md absolute overflow-hidden flex flex-col items-center justify-center pointer-events-none z-0 object-contain`}
        >
          <Pressable
            onPress={() => {
              if (size === "small") return;
              if (controlsOpacity.value > 0) {
                hideControls();
              } else {
                showControlsAndResetTimer();
              }
            }}
            className="w-full h-full"
          >
            {videoSource && (
              <Video
                ref={videoRef}
                allowsExternalPlayback
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="contain"
                playWhenInactive={true}
                playInBackground={true}
                showNotificationControls={true}
                ignoreSilentSwitch="ignore"
                controls={false}
                pictureInPicture={true}
                debug={{
                  enable: true,
                  thread: true,
                }}
                onProgress={(e) => {
                  if (sliding.current === true) return;
                  onProgress(e);
                  progress.value = e.currentTime * 10000000;
                }}
                subtitleStyle={{
                  fontSize: 16,
                }}
                source={videoSource}
                onRestoreUserInterfaceForPictureInPictureStop={() => {
                  setTimeout(() => {
                    presentFullscreenPlayer();
                  }, 300);
                }}
                onFullscreenPlayerDidDismiss={() => {}}
                onFullscreenPlayerDidPresent={() => {}}
                onPlaybackStateChanged={(e) => {
                  if (e.isPlaying === true) {
                    playVideo(false);
                  } else if (e.isPlaying === false) {
                    pauseVideo(false);
                  }
                }}
                onVolumeChange={(e) => {
                  setVolume(e.volume);
                }}
                progressUpdateInterval={4000}
                onError={(e) => {
                  console.log(e);
                  writeToLog(
                    "ERROR",
                    "Video playback error: " + JSON.stringify(e)
                  );
                  Alert.alert("Error", "Cannot play this video file.");
                  setIsPlaying(false);
                  // setCurrentlyPlaying(null);
                }}
                renderLoader={
                  currentlyPlaying.item?.Type !== "Audio" && (
                    <View className="flex flex-col items-center justify-center h-full">
                      <Loader />
                    </View>
                  )
                }
              />
            )}
          </Pressable>
        </Animated.View>

        <Animated.View
          style={[
            {
              borderRadius: 100,
              position: "absolute",
              bottom: insets.bottom + 8,
              left: insets.left + PADDING * 4,
              width: screenWiidth - insets.left - insets.right - PADDING * 8,
            },
            animatedSliderStyle,
            animatedControlsStyle,
          ]}
        >
          <BlurView
            intensity={100}
            className="flex flex-row bg-neutral-800 items-center space-x-6 rounded-full py-1.5 pl-4 pr-4 z-10 overflow-hidden"
          >
            <View className="flex flex-row items-center space-x-2">
              <Ionicons name="play-skip-back" size={18} color="white" />
              <TouchableOpacity
                onPress={async () => {
                  const curr = await videoRef.current?.getCurrentPosition();
                  if (!curr) return;
                  videoRef.current?.seek(Math.max(0, curr - 15));
                  resetHideControlsTimer();
                }}
              >
                <Ionicons
                  name="refresh-outline"
                  size={22}
                  color="white"
                  style={{
                    transform: [{ scaleY: -1 }, { rotate: "180deg" }],
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (isPlaying) pauseVideo();
                  else playVideo();
                  resetHideControlsTimer();
                }}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const curr = await videoRef.current?.getCurrentPosition();
                  if (!curr) return;
                  videoRef.current?.seek(Math.max(0, curr + 15));
                  resetHideControlsTimer();
                }}
              >
                <Ionicons name="refresh-outline" size={22} color="white" />
              </TouchableOpacity>
              <Ionicons name="play-skip-forward" size={18} color="white" />
            </View>
            <View className="flex flex-col w-full shrink">
              <Slider
                theme={{
                  maximumTrackTintColor: "rgba(255,255,255,0.2)",
                  minimumTrackTintColor: "#fff",
                  cacheTrackTintColor: "#333",
                  bubbleBackgroundColor: "#fff",
                  bubbleTextColor: "#000",
                  heartbeatColor: "#999",
                }}
                onSlidingStart={() => {
                  sliding.current = true;
                }}
                onSlidingComplete={(val) => {
                  const tick = Math.floor(val);
                  videoRef.current?.seek(tick / 10000000);
                  sliding.current = false;
                }}
                onValueChange={(val) => {
                  const tick = Math.floor(val);
                  progress.value = tick;
                  resetHideControlsTimer();
                }}
                containerStyle={{
                  borderRadius: 100,
                }}
                bubble={(s) => runtimeTicksToMinutes(s)}
                sliderHeight={8}
                thumbWidth={0}
                progress={progress}
                minimumValue={min}
                maximumValue={max}
              />
              <Text className="text-[10px] text-neutral-500">
                {runtimeTicksToSeconds(progress.value)}
              </Text>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </View>
  );
};
