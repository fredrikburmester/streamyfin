import { apiAtom } from "@/providers/JellyfinProvider";
import { usePlayback } from "@/providers/PlaybackProvider";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { writeToLog } from "@/utils/log";
import { runtimeTicksToMinutes, runtimeTicksToSeconds } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSegments } from "expo-router";
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import { Text } from "./common/Text";
import { Loader } from "./Loader";

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
  const insets = useSafeAreaInsets();

  const [api] = useAtom(apiAtom);

  const [ignoreSafeArea, setIgnoreSafeArea] = useState(false);

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  const controlsOpacity = useSharedValue(1);
  const progress = useSharedValue(0);
  const min = useSharedValue(0);
  const max = useSharedValue(currentlyPlaying?.item.RunTimeTicks || 0);
  const sliding = useRef(false);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const from = useMemo(() => segments[2] || "(home)", [segments]);

  const toggleIgnoreSafeArea = () => {
    setIgnoreSafeArea((prev) => !prev);
  };

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
        artist: currentlyPlaying.item?.AlbumArtist ?? undefined,
        title: currentlyPlaying.item?.Name || "Unknown",
        description: currentlyPlaying.item?.Overview ?? undefined,
        imageUri: poster,
        subtitle: currentlyPlaying.item?.Album ?? undefined, // Change here
      },
    };
  }, [currentlyPlaying, startPosition, api, poster]);

  const showControlsAndResetTimer = () => {
    showControls();
    resetHideControlsTimer();
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
    if (controlsOpacity.value > 0) {
      resetHideControlsTimer();
    }

    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [controlsOpacity.value]);

  useEffect(() => {
    max.value = currentlyPlaying?.item.RunTimeTicks || 0;
  }, [currentlyPlaying?.item.RunTimeTicks]);

  const videoContainerStyle = {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    left: ignoreSafeArea ? 0 : insets.left,
    right: ignoreSafeArea ? 0 : insets.right,
    width: ignoreSafeArea
      ? screenWidth
      : screenWidth - (insets.left + insets.right),
  };

  if (!api || !currentlyPlaying) return null;

  return (
    <View style={{ width: screenWidth, height: screenHeight }}>
      <View style={{ width: "100%", height: "100%", backgroundColor: "black" }}>
        <View
          style={[
            {
              position: "absolute",
              bottom: insets.bottom + 40,
              left: 32 + insets.left,
              height: 64,
              width: 140,
              zIndex: 10,
            },
          ]}
        ></View>

        <Animated.View
          style={[
            {
              position: "absolute",
              top: insets.top,
              right: insets.right + 20,
              height: 70,
              zIndex: 10,
            },
            animatedControlsStyle,
          ]}
        >
          <View className="flex flex-row items-center h-full">
            <TouchableOpacity
              onPress={() => {
                if (controlsOpacity.value === 0) return;
                toggleIgnoreSafeArea();
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              <Ionicons
                name={ignoreSafeArea ? "contract-outline" : "expand"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (controlsOpacity.value === 0) return;
                stopPlayback();
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={videoContainerStyle}>
          <Pressable
            onPress={() => {
              if (controlsOpacity.value > 0) {
                hideControls();
              } else {
                showControlsAndResetTimer();
              }
            }}
            style={{ width: "100%", height: "100%" }}
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
        </View>

        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: insets.bottom + 8,
              left: insets.left + 32,
              width: screenWidth - insets.left - insets.right - 64,
              borderRadius: 100,
            },
            animatedControlsStyle,
          ]}
        >
          <View className="shrink flex flex-col justify-center h-full mb-2">
            <Text className="font-bold">{currentlyPlaying.item?.Name}</Text>
            {currentlyPlaying.item?.Type === "Episode" && (
              <Text className="opacity-50">
                {currentlyPlaying.item.SeriesName}
              </Text>
            )}
            {currentlyPlaying.item?.Type === "Movie" && (
              <Text className="text-xs opacity-50">
                {currentlyPlaying.item?.ProductionYear}
              </Text>
            )}
            {currentlyPlaying.item?.Type === "Audio" && (
              <Text className="text-xs opacity-50">
                {currentlyPlaying.item?.Album}
              </Text>
            )}
          </View>
          <BlurView
            intensity={100}
            className="flex flex-row items-center space-x-6 rounded-full py-1.5 pl-4 pr-4 z-10 overflow-hidden"
          >
            <View className="flex flex-row items-center space-x-2">
              <Ionicons name="play-skip-back" size={18} color="white" />
              <TouchableOpacity
                onPress={async () => {
                  if (controlsOpacity.value === 0) return;
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
                  if (controlsOpacity.value === 0) return;
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
                  if (controlsOpacity.value === 0) return;
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
                  if (controlsOpacity.value === 0) return;
                  sliding.current = true;
                }}
                onSlidingComplete={(val) => {
                  if (controlsOpacity.value === 0) return;
                  const tick = Math.floor(val);
                  videoRef.current?.seek(tick / 10000000);
                  sliding.current = false;
                }}
                onValueChange={(val) => {
                  if (controlsOpacity.value === 0) return;
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
              <View className="flex flex-row items-center justify-between">
                <Text className="text-[10px] text-neutral-400">
                  {runtimeTicksToSeconds(progress.value)}
                </Text>
                <Text className="text-[10px] text-neutral-400">
                  -{runtimeTicksToSeconds(max.value - progress.value)}
                </Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </View>
  );
};
