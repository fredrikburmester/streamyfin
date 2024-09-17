import { useAdjacentEpisodes } from "@/hooks/useAdjacentEpisodes";
import { useControlsVisibility } from "@/hooks/useControlsVisibility";
import { useTrickplay } from "@/hooks/useTrickplay";
import { apiAtom } from "@/providers/JellyfinProvider";
import { usePlayback } from "@/providers/PlaybackProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { writeToLog } from "@/utils/log";
import { secondsToTicks } from "@/utils/secondsToTicks";
import { runtimeTicksToSeconds } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter, useSegments } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Video, { OnProgressData } from "react-native-video";
import { Text } from "./common/Text";
import { itemRouter } from "./common/TouchableItemRouter";
import { Loader } from "./Loader";

async function setOrientation(orientation: ScreenOrientation.OrientationLock) {
  await ScreenOrientation.lockAsync(orientation);
}

async function resetOrientation() {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
}

export const CurrentlyPlayingBar: React.FC = () => {
  const {
    currentlyPlaying,
    pauseVideo,
    playVideo,
    stopPlayback,
    setVolume,
    setIsPlaying,
    isPlaying,
    videoRef,
    onProgress,
    isBuffering: _isBuffering,
    setIsBuffering,
  } = usePlayback();

  const [settings] = useSettings();
  const [api] = useAtom(apiAtom);
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();

  const { trickPlayUrl, calculateTrickplayUrl, trickplayInfo } =
    useTrickplay(currentlyPlaying);
  const { previousItem, nextItem } = useAdjacentEpisodes({ currentlyPlaying });
  const { isVisible, showControls, hideControls } = useControlsVisibility(3000);

  const [ignoreSafeArea, setIgnoreSafeArea] = useState(false);
  const from = useMemo(() => segments[2], [segments]);

  const progress = useSharedValue(0);
  const min = useSharedValue(0);
  const max = useSharedValue(currentlyPlaying?.item.RunTimeTicks || 0);
  const sliding = useRef(false);
  const localIsBuffering = useSharedValue(false);
  const cacheProgress = useSharedValue(0);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const toggleIgnoreSafeArea = useCallback(() => {
    setIgnoreSafeArea((prev) => !prev);
  }, []);

  const handleToggleControlsPress = useCallback(() => {
    isVisible ? hideControls() : showControls();
  }, [isVisible, hideControls, showControls]);

  const poster = useMemo(() => {
    if (!currentlyPlaying?.item || !api) return "";
    return currentlyPlaying.item.Type === "Audio"
      ? `${api.basePath}/Items/${currentlyPlaying.item.AlbumId}/Images/Primary?tag=${currentlyPlaying.item.AlbumPrimaryImageTag}&quality=90&maxHeight=200&maxWidth=200`
      : getBackdropUrl({
          api,
          item: currentlyPlaying.item,
          quality: 70,
          width: 200,
        });
  }, [currentlyPlaying?.item, api]);

  const videoSource = useMemo(() => {
    if (!api || !currentlyPlaying || !poster) return null;
    const startPosition = currentlyPlaying.item?.UserData?.PlaybackPositionTicks
      ? Math.round(currentlyPlaying.item.UserData.PlaybackPositionTicks / 10000)
      : 0;
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
  }, [currentlyPlaying, api, poster]);

  useEffect(() => {
    max.value = currentlyPlaying?.item.RunTimeTicks || 0;
  }, [currentlyPlaying?.item.RunTimeTicks]);

  useEffect(() => {
    if (!currentlyPlaying) {
      resetOrientation();
      progress.value = 0;
      min.value = 0;
      max.value = 0;
      cacheProgress.value = 0;
      localIsBuffering.value = false;
      sliding.current = false;
      hideControls();
    } else {
      setOrientation(
        settings?.defaultVideoOrientation ||
          ScreenOrientation.OrientationLock.DEFAULT
      );
      progress.value =
        currentlyPlaying.item?.UserData?.PlaybackPositionTicks || 0;
      max.value = currentlyPlaying.item.RunTimeTicks || 0;
      showControls();
    }
  }, [currentlyPlaying, settings]);

  const animatedStyles = {
    controls: useAnimatedStyle(() => ({
      opacity: withTiming(isVisible ? 1 : 0, { duration: 300 }),
    })),
    videoContainer: useAnimatedStyle(() => ({
      opacity: withTiming(isVisible || localIsBuffering.value ? 0.5 : 1, {
        duration: 300,
      }),
    })),
    loader: useAnimatedStyle(() => ({
      opacity: withTiming(localIsBuffering.value ? 1 : 0, { duration: 300 }),
    })),
  };

  const { data: introTimestamps } = useQuery({
    queryKey: ["introTimestamps", currentlyPlaying?.item.Id],
    queryFn: async () => {
      if (!currentlyPlaying?.item.Id) {
        console.log("No item id");
        return null;
      }

      const res = await api?.axiosInstance.get(
        `${api.basePath}/Episode/${currentlyPlaying.item.Id}/IntroTimestamps`,
        {
          headers: getAuthHeaders(api),
        }
      );

      if (res?.status !== 200) {
        return null;
      }

      return res?.data as {
        EpisodeId: string;
        HideSkipPromptAt: number;
        IntroEnd: number;
        IntroStart: number;
        ShowSkipPromptAt: number;
        Valid: boolean;
      };
    },
    enabled: !!currentlyPlaying?.item.Id,
  });

  const animatedIntroSkipperStyle = useAnimatedStyle(() => {
    const showButtonAt = secondsToTicks(introTimestamps?.ShowSkipPromptAt || 0);
    const hideButtonAt = secondsToTicks(introTimestamps?.HideSkipPromptAt || 0);
    const showButton =
      progress.value > showButtonAt && progress.value < hideButtonAt;
    return {
      opacity: withTiming(
        localIsBuffering.value === false && isVisible && showButton ? 1 : 0,
        {
          duration: 300,
        }
      ),
    };
  });

  const skipIntro = useCallback(async () => {
    if (!introTimestamps || !videoRef.current) return;
    try {
      videoRef.current.seek(introTimestamps.IntroEnd);
    } catch (error) {
      writeToLog("ERROR", "Error skipping intro", error);
    }
  }, [introTimestamps]);

  const handleVideoProgress = useCallback(
    (e: OnProgressData) => {
      if (e.playableDuration === 0) {
        setIsBuffering(true);
        localIsBuffering.value = true;
      } else {
        setIsBuffering(false);
        localIsBuffering.value = false;
      }

      if (sliding.current) return;
      onProgress(e);
      progress.value = secondsToTicks(e.currentTime);
      cacheProgress.value = secondsToTicks(e.playableDuration);
    },
    [onProgress, setIsBuffering]
  );

  const handleVideoError = useCallback(
    (e: any) => {
      console.log(e);
      writeToLog("ERROR", "Video playback error: " + JSON.stringify(e));
      Alert.alert("Error", "Cannot play this video file.");
      setIsPlaying(false);
    },
    [setIsPlaying]
  );

  const handleSkipBackward = useCallback(async () => {
    try {
      const curr = await videoRef.current?.getCurrentPosition();
      if (curr !== undefined) {
        videoRef.current?.seek(Math.max(0, curr - 15));
        showControls();
      }
    } catch (error) {
      writeToLog("ERROR", "Error seeking video backwards", error);
    }
  }, [videoRef, showControls]);

  const handleSkipForward = useCallback(async () => {
    try {
      const curr = await videoRef.current?.getCurrentPosition();
      if (curr !== undefined) {
        videoRef.current?.seek(Math.max(0, curr + 15));
        showControls();
      }
    } catch (error) {
      writeToLog("ERROR", "Error seeking video forwards", error);
    }
  }, [videoRef, showControls]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) pauseVideo();
    else playVideo();
    showControls();
  }, [isPlaying, pauseVideo, playVideo, showControls]);

  const handleSliderStart = useCallback(() => {
    sliding.current = true;
  }, []);

  const handleSliderComplete = useCallback(
    (val: number) => {
      const tick = Math.floor(val);
      videoRef.current?.seek(tick / 10000000);
      sliding.current = false;
    },
    [videoRef]
  );

  const handleSliderChange = useCallback(
    (val: number) => {
      const tick = Math.floor(val);
      progress.value = tick;
      calculateTrickplayUrl(progress);
      showControls();
    },
    [progress, calculateTrickplayUrl, showControls]
  );

  if (!api || !currentlyPlaying) return null;

  if (!api || !currentlyPlaying) return null;

  return (
    <View
      style={{
        width: screenWidth,
        height: screenHeight,
        backgroundColor: "black",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: ignoreSafeArea ? 0 : insets.left,
            right: ignoreSafeArea ? 0 : insets.right,
            width: ignoreSafeArea
              ? screenWidth
              : screenWidth - (insets.left + insets.right),
          },
          animatedStyles.videoContainer,
        ]}
      >
        <Pressable
          onPress={handleToggleControlsPress}
          style={{
            width: "100%",
            height: "100%",
          }}
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
              onProgress={handleVideoProgress}
              subtitleStyle={{
                fontSize: 16,
              }}
              source={videoSource}
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
              progressUpdateInterval={1000}
              onError={handleVideoError}
              renderLoader={
                <View
                  pointerEvents="none"
                  className="absolute w-screen h-screen top-0 left-0 items-center justify-center"
                >
                  <Loader />
                </View>
              }
            />
          )}
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute" as const,
            top: 0,
            bottom: 0,
            left: ignoreSafeArea ? 0 : insets.left,
            right: ignoreSafeArea ? 0 : insets.right,
            width: ignoreSafeArea
              ? screenWidth
              : screenWidth - (insets.left + insets.right),
            justifyContent: "center",
            alignItems: "center",
          },
          animatedStyles.loader,
        ]}
      >
        <Loader />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: insets.bottom + 8 * 7,
            right: insets.right + 32,
          },
          animatedIntroSkipperStyle,
        ]}
      >
        <View className="flex flex-row items-center h-full">
          <TouchableOpacity
            disabled={!isVisible}
            onPress={() => {
              skipIntro();
            }}
            className="flex flex-col items-center justify-center px-2 py-1.5 bg-purple-600 rounded-full"
          >
            <Text>Skip intro</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            top: insets.top,
            right: insets.right + 20,
            height: 70,
          },
          animatedStyles.controls,
        ]}
      >
        <View className="flex flex-row items-center h-full">
          <TouchableOpacity
            disabled={!isVisible}
            onPress={() => {
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
            disabled={!isVisible}
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
        style={[
          {
            position: "absolute",
            bottom: insets.bottom + 8,
            left: insets.left + 32,
            width: screenWidth - insets.left - insets.right - 64,
            borderRadius: 100,
          },
          animatedStyles.controls,
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
        <View className="flex flex-row items-center space-x-6 rounded-full py-1.5 pl-4 pr-4 bg-neutral-800">
          <View className="flex flex-row items-center space-x-2">
            <TouchableOpacity
              disabled={!previousItem || !isVisible || !from}
              style={{
                opacity: !previousItem ? 0.5 : 1,
              }}
              onPress={() => {
                if (!previousItem || !from) return;
                const url = itemRouter(previousItem, from);
                stopPlayback();
                // @ts-ignore
                router.push(url);
              }}
            >
              <Ionicons name="play-skip-back" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!isVisible}
              onPress={handleSkipBackward}
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
            <TouchableOpacity disabled={!isVisible} onPress={handlePlayPause}>
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity disabled={!isVisible} onPress={handleSkipForward}>
              <Ionicons name="refresh-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!nextItem || !isVisible || !from}
              style={{
                opacity: !nextItem ? 0.5 : 1,
              }}
              onPress={() => {
                if (!nextItem || !from) return;
                const url = itemRouter(nextItem, from);
                stopPlayback();
                // @ts-ignore
                router.push(url);
              }}
            >
              <Ionicons name="play-skip-forward" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <View className="flex flex-col w-full shrink">
            <Slider
              disable={!isVisible}
              theme={{
                maximumTrackTintColor: "rgba(255,255,255,0.2)",
                minimumTrackTintColor: "#fff",
                cacheTrackTintColor: "rgba(255,255,255,0.3)",
                bubbleBackgroundColor: "#fff",
                bubbleTextColor: "#000",
                heartbeatColor: "#999",
              }}
              cache={cacheProgress}
              onSlidingStart={handleSliderStart}
              onSlidingComplete={handleSliderComplete}
              onValueChange={handleSliderChange}
              containerStyle={{
                borderRadius: 100,
              }}
              renderBubble={() => {
                if (!trickPlayUrl || !trickplayInfo) {
                  return null;
                }
                const { x, y, url } = trickPlayUrl;

                const tileWidth = 150;
                const tileHeight = 150 / trickplayInfo.aspectRatio!;
                return (
                  <View
                    style={{
                      width: tileWidth,
                      height: tileHeight,
                      marginLeft: -tileWidth / 4,
                      marginTop: -tileHeight / 4 - 60,
                    }}
                    className=" bg-neutral-800 overflow-hidden"
                  >
                    <Image
                      style={{
                        width: 150 * trickplayInfo?.data.TileWidth!,
                        height:
                          (150 / trickplayInfo.aspectRatio!) *
                          trickplayInfo?.data.TileHeight!,
                        transform: [
                          { translateX: -x * tileWidth },
                          { translateY: -y * tileHeight },
                        ],
                      }}
                      source={{ uri: url }}
                      contentFit="cover"
                    />
                  </View>
                );
              }}
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
        </View>
      </Animated.View>
    </View>
  );
};
