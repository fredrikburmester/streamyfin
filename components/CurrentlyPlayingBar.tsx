import {
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "./common/Text";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video, { OnProgressData, VideoRef } from "react-native-video";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { atom, useAtom } from "jotai";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCastDevice, useRemoteMediaClient } from "react-native-google-cast";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { chromecastProfile } from "@/utils/profiles/chromecast";
import ios12 from "@/utils/profiles/ios12";
import { reportPlaybackProgress } from "@/utils/jellyfin/playstate/reportPlaybackProgress";
import { reportPlaybackStopped } from "@/utils/jellyfin/playstate/reportPlaybackStopped";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useRouter, useSegments } from "expo-router";
import { BlurView } from "expo-blur";
import { writeToLog } from "@/utils/log";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { Image } from "expo-image";

export const currentlyPlayingItemAtom = atom<{
  item: BaseItemDto;
  playbackUrl: string;
} | null>(null);

export const CurrentlyPlayingBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [cp, setCp] = useAtom(currentlyPlayingItemAtom);

  const castDevice = useCastDevice();
  const client = useRemoteMediaClient();
  const queryClient = useQueryClient();
  const segments = useSegments();

  const videoRef = useRef<VideoRef | null>(null);
  const [paused, setPaused] = useState(true);
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
    queryKey: ["item", cp?.item.Id],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId: cp?.item.Id,
      }),
    enabled: !!cp?.item.Id && !!api,
    staleTime: 60,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["sessionData", cp?.item.Id],
    queryFn: async () => {
      if (!cp?.item.Id) return null;
      const playbackData = await getMediaInfoApi(api!).getPlaybackInfo({
        itemId: cp?.item.Id,
        userId: user?.Id,
      });
      return playbackData.data;
    },
    enabled: !!cp?.item.Id && !!api && !!user?.Id,
    staleTime: 0,
  });

  const onProgress = useCallback(
    ({ currentTime }: OnProgressData) => {
      if (!currentTime || !sessionData?.PlaySessionId || paused) return;
      const newProgress = currentTime * 10000000;
      setProgress(newProgress);
      reportPlaybackProgress({
        api,
        itemId: cp?.item.Id,
        positionTicks: newProgress,
        sessionId: sessionData.PlaySessionId,
      });
    },
    [sessionData?.PlaySessionId, item, api, paused],
  );

  const play = () => {
    if (videoRef.current) {
      videoRef.current.resume();
      setPaused(false);
    }
  };

  const pause = useCallback(() => {
    videoRef.current?.pause();
    setPaused(true);

    if (progress > 0)
      reportPlaybackStopped({
        api,
        itemId: item?.Id,
        positionTicks: progress,
        sessionId: sessionData?.PlaySessionId,
      });

    queryClient.invalidateQueries({
      queryKey: ["nextUp", item?.SeriesId],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["episodes"],
      refetchType: "all",
    });
  }, [api, item, progress, sessionData, queryClient]);

  const startPosition = useMemo(
    () =>
      item?.UserData?.PlaybackPositionTicks
        ? Math.round(item.UserData.PlaybackPositionTicks / 10000)
        : 0,
    [item],
  );

  const backdropUrl = useMemo(
    () =>
      getBackdropUrl({
        api,
        item,
        quality: 70,
        width: 200,
      }),
    [item],
  );

  useEffect(() => {
    if (cp?.playbackUrl) {
      play();
    }
  }, [cp?.playbackUrl]);

  if (!cp) return null;

  return (
    <Animated.View
      style={[animatedOuterStyle]}
      className="absolute left-0 w-screen"
    >
      <BlurView
        intensity={Platform.OS === "android" ? 60 : 100}
        experimentalBlurMethod={Platform.OS === "android" ? "none" : undefined}
        className={`h-full w-full rounded-xl overflow-hidden ${Platform.OS === "android" && "bg-black"}`}
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
              {cp.playbackUrl && (
                <Video
                  ref={videoRef}
                  style={{ width: "100%", height: "100%" }}
                  allowsExternalPlayback={true}
                  playInBackground={true}
                  playWhenInactive={true}
                  showNotificationControls={true}
                  ignoreSilentSwitch="ignore"
                  controls={false}
                  poster={backdropUrl ? backdropUrl : undefined}
                  paused={paused}
                  onProgress={(e) => onProgress(e)}
                  subtitleStyle={{
                    fontSize: 16,
                  }}
                  source={{
                    uri: cp.playbackUrl,
                    isNetwork: true,
                    startPosition,
                  }}
                  onBuffer={(e) =>
                    e.isBuffering ? console.log("Buffering...") : null
                  }
                  onFullscreenPlayerDidDismiss={() => {
                    play();
                  }}
                  onError={(e) => {
                    console.log(e);
                    writeToLog(
                      "ERROR",
                      "Video playback error: " + JSON.stringify(e),
                    );
                  }}
                  renderLoader={
                    item?.Type === "Video" && (
                      <View className="flex flex-col items-center justify-center h-full">
                        <ActivityIndicator size={"small"} color={"white"} />
                      </View>
                    )
                  }
                />
              )}
            </TouchableOpacity>
            <View className="shrink text-xs">
              <TouchableOpacity
                onPress={() => {
                  router.push(`/(auth)/items/${item?.Id}/page`);
                }}
              >
                <Text>{item?.Name}</Text>
              </TouchableOpacity>
              {item?.SeriesName ? (
                <TouchableOpacity
                  onPress={() => {
                    router.push(`/(auth)/series/${item.SeriesId}/page`);
                  }}
                  className="text-xs opacity-50"
                >
                  <Text>{item.SeriesName}</Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <Text className="text-xs opacity-50">
                    {item?.ProductionYear}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View className="flex flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => {
                if (paused) play();
                else pause();
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              {paused ? (
                <Ionicons name="play" size={24} color="white" />
              ) : (
                <Ionicons name="pause" size={24} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setCp(null);
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
