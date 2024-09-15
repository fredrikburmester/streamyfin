import { useAdjacentEpisodes } from "@/hooks/useAdjacentEpisodes";
import { useControlsVisibility } from "@/hooks/useControlsVisibility";
import { useNavigationBarVisibility } from "@/hooks/useNavigationBarVisibility";
import { useTrickplay } from "@/hooks/useTrickplay";
import { apiAtom } from "@/providers/JellyfinProvider";
import { usePlayback } from "@/providers/PlaybackProvider";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { writeToLog } from "@/utils/log";
import { secondsToTicks } from "@/utils/secondsToTicks";
import { runtimeTicksToSeconds } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter, useSegments } from "expo-router";
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
import Video from "react-native-video";
import { Text } from "./common/Text";
import { itemRouter } from "./common/TouchableItemRouter";
import { Loader } from "./Loader";

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
    progressTicks,
    onProgress,
    isBuffering: _isBuffering,
    setIsBuffering,
  } = usePlayback();

  useNavigationBarVisibility(isPlaying);

  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();

  const { trickPlayUrl, calculateTrickplayUrl, trickplayInfo } =
    useTrickplay(currentlyPlaying);

  const [api] = useAtom(apiAtom);

  const from = useMemo(() => segments[2], [segments]);

  const [ignoreSafeArea, setIgnoreSafeArea] = useState(false);

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  const progress = useSharedValue(progressTicks || 0);
  const min = useSharedValue(0);
  const max = useSharedValue(currentlyPlaying?.item.RunTimeTicks || 0);
  const sliding = useRef(false);
  const localIsBuffering = useSharedValue(false);

  const toggleIgnoreSafeArea = () => {
    setIgnoreSafeArea((prev) => !prev);
  };

  const { isVisible, showControls, hideControls } = useControlsVisibility(3000);

  const animatedControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isVisible ? 1 : 0, {
        duration: 300,
      }),
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

  const animatedLoaderStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(localIsBuffering.value === true ? 1 : 0, {
        duration: 300,
      }),
    };
  });

  const animatedVideoContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        isVisible || localIsBuffering.value === true ? 0.5 : 1,
        {
          duration: 300,
        }
      ),
    };
  });

  const { previousItem, nextItem } = useAdjacentEpisodes({
    currentlyPlaying,
  });

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
    if (!introTimestamps) return;
    videoRef.current?.seek(introTimestamps.IntroEnd);
  }, [introTimestamps]);

  useEffect(() => {
    showControls();
  }, [currentlyPlaying]);

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
              if (!isVisible) return;
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
              if (!isVisible) return;
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
            bottom: insets.bottom + 8 * 7,
            right: insets.right + 32,
            zIndex: 10,
          },
          animatedIntroSkipperStyle,
        ]}
      >
        <View className="flex flex-row items-center h-full">
          <TouchableOpacity
            onPress={() => {
              if (!isVisible) return;
              skipIntro();
            }}
            className="flex flex-col items-center justify-center px-2 py-1.5 bg-purple-600 rounded-full"
          >
            <Text>Skip intro</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[videoContainerStyle, animatedVideoContainerStyle]}>
        <Pressable
          onPress={() => {
            if (isVisible) {
              hideControls();
            } else {
              showControls();
            }
          }}
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
              onProgress={(e) => {
                if (e.playableDuration === 0) {
                  setIsBuffering(true);
                  localIsBuffering.value = true;
                } else {
                  setIsBuffering(false);
                  localIsBuffering.value = false;
                }

                if (sliding.current === true) return;
                onProgress(e);
                progress.value = e.currentTime * 10000000;
              }}
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
                <View className="absolute w-screen h-screen flex flex-col items-center justify-center">
                  <Loader />
                </View>
              }
            />
          )}
        </Pressable>
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
        <View className="flex flex-row items-center space-x-6 rounded-full py-1.5 pl-4 pr-4 z-10 bg-neutral-800">
          <View className="flex flex-row items-center space-x-2">
            <TouchableOpacity
              disabled={!previousItem}
              style={{
                opacity: !previousItem ? 0.5 : 1,
              }}
              onPress={() => {
                if (!isVisible) return;
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
              onPress={async () => {
                if (!isVisible) return;
                const curr = await videoRef.current?.getCurrentPosition();
                if (!curr) return;
                videoRef.current?.seek(Math.max(0, curr - 15));
                showControls();
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
                if (!isVisible) return;
                if (isPlaying) pauseVideo();
                else playVideo();
                showControls();
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
                if (!isVisible) return;
                const curr = await videoRef.current?.getCurrentPosition();
                if (!curr) return;
                videoRef.current?.seek(Math.max(0, curr + 15));
                showControls();
              }}
            >
              <Ionicons name="refresh-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!nextItem}
              style={{
                opacity: !nextItem ? 0.5 : 1,
              }}
              onPress={() => {
                if (!isVisible) return;
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
              theme={{
                maximumTrackTintColor: "rgba(255,255,255,0.2)",
                minimumTrackTintColor: "#fff",
                cacheTrackTintColor: "#333",
                bubbleBackgroundColor: "#fff",
                bubbleTextColor: "#000",
                heartbeatColor: "#999",
              }}
              onSlidingStart={() => {
                if (!isVisible) return;
                sliding.current = true;
              }}
              onSlidingComplete={(val) => {
                if (!isVisible) return;
                const tick = Math.floor(val);
                videoRef.current?.seek(tick / 10000000);
                sliding.current = false;
              }}
              onValueChange={(val) => {
                if (!isVisible) return;
                const tick = Math.floor(val);
                progress.value = tick;
                calculateTrickplayUrl(progress);
                showControls();
              }}
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
            zIndex: 10,
          },
          animatedLoaderStyle,
        ]}
      >
        <Loader />
      </Animated.View>
    </View>
  );
};
