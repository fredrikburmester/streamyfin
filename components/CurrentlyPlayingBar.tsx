import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  currentlyPlayingItemAtom,
  fullScreenAtom,
  playingAtom,
  showCurrentlyPlayingBarAtom,
} from "@/utils/atoms/playState";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { reportPlaybackProgress } from "@/utils/jellyfin/playstate/reportPlaybackProgress";
import { reportPlaybackStopped } from "@/utils/jellyfin/playstate/reportPlaybackStopped";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import { writeToLog } from "@/utils/log";
import { Ionicons } from "@expo/vector-icons";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { useRouter, useSegments } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Video, { OnProgressData, VideoRef } from "react-native-video";
import { Text } from "./common/Text";
import { Loader } from "./Loader";

export const CurrentlyPlayingBar: React.FC = () => {
  const segments = useSegments();
  const queryClient = useQueryClient();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [playing, setPlaying] = useAtom(playingAtom);
  const [currentlyPlaying, setCurrentlyPlaying] = useAtom(
    currentlyPlayingItemAtom
  );
  const [fullScreen, setFullScreen] = useAtom(fullScreenAtom);
  const [show, setShow] = useAtom(showCurrentlyPlayingBarAtom);

  const videoRef = useRef<VideoRef | null>(null);
  const [progress, setProgress] = useState(0);

  const aBottom = useSharedValue(0);
  const aPadding = useSharedValue(0);
  const aHeight = useSharedValue(100);
  const router = useRouter();
  const animatedOuterStyle = useAnimatedStyle(() => {
    return {
      bottom: withTiming(aBottom.value, { duration: 500 }),
      height: withTiming(aHeight.value, { duration: 500 }),
      padding: withTiming(aPadding.value, { duration: 500 }),
    };
  });

  const aPaddingBottom = useSharedValue(30);
  const aPaddingInner = useSharedValue(12);
  const aBorderRadiusBottom = useSharedValue(12);
  const animatedInnerStyle = useAnimatedStyle(() => {
    return {
      padding: withTiming(aPaddingInner.value, { duration: 500 }),
      paddingBottom: withTiming(aPaddingBottom.value, { duration: 500 }),
      borderBottomLeftRadius: withTiming(aBorderRadiusBottom.value, {
        duration: 500,
      }),
      borderBottomRightRadius: withTiming(aBorderRadiusBottom.value, {
        duration: 500,
      }),
    };
  });

  useEffect(() => {
    if (segments.find((s) => s.includes("tabs"))) {
      // Tab screen - i.e. home
      aBottom.value = Platform.OS === "ios" ? 78 : 50;
      aHeight.value = 80;
      aPadding.value = 8;
      aPaddingBottom.value = 8;
      aPaddingInner.value = 8;
    } else {
      // Inside a normal screen
      aBottom.value = Platform.OS === "ios" ? 0 : 0;
      aHeight.value = Platform.OS === "ios" ? 110 : 80;
      aPadding.value = Platform.OS === "ios" ? 0 : 8;
      aPaddingInner.value = Platform.OS === "ios" ? 12 : 8;
      aPaddingBottom.value = Platform.OS === "ios" ? 40 : 12;
    }
  }, [segments]);

  const { data: item } = useQuery({
    queryKey: ["item", currentlyPlaying?.item.Id],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId: currentlyPlaying?.item.Id,
      }),
    enabled: !!currentlyPlaying?.item.Id && !!api,
    staleTime: 60,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["sessionData", currentlyPlaying?.item.Id],
    queryFn: async () => {
      if (!currentlyPlaying?.item.Id) return null;
      const playbackData = await getMediaInfoApi(api!).getPlaybackInfo({
        itemId: currentlyPlaying?.item.Id,
        userId: user?.Id,
      });
      return playbackData.data;
    },
    enabled: !!currentlyPlaying?.item.Id && !!api && !!user?.Id,
    staleTime: 0,
  });

  const onProgress = useCallback(
    ({ currentTime }: OnProgressData) => {
      if (
        !sessionData?.PlaySessionId ||
        !api ||
        !currentlyPlaying?.item.Id ||
        !user?.Id ||
        !currentTime
      ) {
        return;
      }
      const newProgress = currentTime * 10000000;
      setProgress(newProgress);

      reportPlaybackProgress({
        api,
        itemId: currentlyPlaying?.item.Id,
        positionTicks: newProgress,
        sessionId: sessionData.PlaySessionId,
        IsPaused: !playing,
      });

      queryClient.invalidateQueries({
        queryKey: ["nextUp", item?.SeriesId],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["episodes"],
        refetchType: "all",
      });
    },
    [sessionData?.PlaySessionId, api, playing, currentlyPlaying?.item.Id]
  );

  useEffect(() => {
    if (!item || !api) return;

    if (playing) {
      videoRef.current?.resume();
    } else {
      videoRef.current?.pause();

      queryClient.invalidateQueries({
        queryKey: ["nextUp", item?.SeriesId],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["episodes"],
        refetchType: "all",
      });
    }
  }, [playing, progress, item, sessionData]);

  useEffect(() => {
    if (fullScreen === true) {
      videoRef.current?.presentFullscreenPlayer();
    } else {
      videoRef.current?.dismissFullscreenPlayer();
    }
  }, [fullScreen]);

  useEffect(() => {
    if (!show && currentlyPlaying && item && sessionData && api) {
      reportPlaybackStopped({
        api,
        itemId: item?.Id,
        sessionId: sessionData?.PlaySessionId,
        positionTicks: progress,
      });
    }
  }, [show]);

  const startPosition = useMemo(
    () =>
      item?.UserData?.PlaybackPositionTicks
        ? Math.round(item.UserData.PlaybackPositionTicks / 10000)
        : 0,
    [item]
  );

  const backdropUrl = useMemo(
    () =>
      getBackdropUrl({
        api,
        item,
        quality: 70,
        width: 200,
      }),
    [item]
  );

  if (show === false || !api) return null;

  return (
    <Animated.View
      style={[animatedOuterStyle]}
      className="absolute left-0 w-screen"
    >
      <BlurView
        intensity={Platform.OS === "android" ? 60 : 100}
        experimentalBlurMethod={Platform.OS === "android" ? "none" : undefined}
        className={`h-full w-full rounded-xl overflow-hidden ${
          Platform.OS === "android" && "bg-black"
        }`}
      >
        <Animated.View
          style={[
            { padding: 8, borderTopLeftRadius: 12, borderTopEndRadius: 12 },
            animatedInnerStyle,
          ]}
          className="h-full w-full  flex flex-row items-center justify-between overflow-hidden"
        >
          <View className="flex flex-row items-center space-x-4 shrink">
            <TouchableOpacity
              onPress={() => {
                videoRef.current?.presentFullscreenPlayer();
              }}
              className={`relative h-full bg-neutral-800 rounded-md overflow-hidden
                ${item?.Type === "Audio" ? "aspect-square" : "aspect-video"}
                `}
            >
              {currentlyPlaying?.playbackUrl && (
                <Video
                  ref={videoRef}
                  allowsExternalPlayback
                  style={{ width: "100%", height: "100%" }}
                  playWhenInactive={true}
                  playInBackground={true}
                  showNotificationControls={true}
                  ignoreSilentSwitch="ignore"
                  controls={false}
                  pictureInPicture={true}
                  poster={
                    backdropUrl && item?.Type === "Audio"
                      ? backdropUrl
                      : undefined
                  }
                  debug={{
                    enable: true,
                    thread: true,
                  }}
                  paused={!playing}
                  onProgress={(e) => onProgress(e)}
                  subtitleStyle={{
                    fontSize: 16,
                  }}
                  source={{
                    uri: currentlyPlaying.playbackUrl,
                    isNetwork: true,
                    startPosition,
                    headers: getAuthHeaders(api),
                  }}
                  onBuffer={(e) =>
                    e.isBuffering ? console.log("Buffering...") : null
                  }
                  onFullscreenPlayerDidDismiss={() => {
                    setFullScreen(false);
                  }}
                  onFullscreenPlayerDidPresent={() => {
                    setFullScreen(true);
                  }}
                  onPlaybackStateChanged={(e) => {
                    if (e.isPlaying) {
                      setPlaying(true);
                    } else if (e.isSeeking) {
                      return;
                    } else {
                      setPlaying(false);
                    }
                  }}
                  progressUpdateInterval={2000}
                  onError={(e) => {
                    console.log(e);
                    writeToLog(
                      "ERROR",
                      "Video playback error: " + JSON.stringify(e)
                    );
                    Alert.alert("Error", "Cannot play this video file.");
                    setPlaying(false);
                    setCurrentlyPlaying(null);
                  }}
                  renderLoader={
                    item?.Type !== "Audio" && (
                      <View className="flex flex-col items-center justify-center h-full">
                        <Loader />
                      </View>
                    )
                  }
                />
              )}
            </TouchableOpacity>
            <View className="shrink text-xs">
              <TouchableOpacity
                onPress={() => {
                  if (item?.Type === "Audio")
                    router.push(`/albums/${item?.AlbumId}`);
                  else router.push(`/items/${item?.Id}`);
                }}
              >
                <Text>{item?.Name}</Text>
              </TouchableOpacity>
              {item?.Type === "Episode" && (
                <TouchableOpacity
                  onPress={() => {
                    router.push(`/(auth)/series/${item.SeriesId}`);
                  }}
                  className="text-xs opacity-50"
                >
                  <Text>{item.SeriesName}</Text>
                </TouchableOpacity>
              )}
              {item?.Type === "Movie" && (
                <View>
                  <Text className="text-xs opacity-50">
                    {item?.ProductionYear}
                  </Text>
                </View>
              )}
              {item?.Type === "Audio" && (
                <TouchableOpacity
                  onPress={() => {
                    router.push(`/albums/${item?.AlbumId}`);
                  }}
                >
                  <Text className="text-xs opacity-50">{item?.Album}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View className="flex flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => {
                if (playing) setPlaying(false);
                else setPlaying(true);
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              {playing ? (
                <Ionicons name="pause" size={24} color="white" />
              ) : (
                <Ionicons name="play" size={24} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShow(false);
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
};
