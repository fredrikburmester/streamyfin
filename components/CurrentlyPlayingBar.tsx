import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { usePlayback } from "@/providers/PlaybackProvider";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { writeToLog } from "@/utils/log";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter, useSegments } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Video from "react-native-video";
import { Text } from "./common/Text";
import { Loader } from "./Loader";
import * as FileSystem from "expo-file-system";
import {
  FFmpegKit,
  FFmpegKitConfig,
  FFmpegSession,
  ReturnCode,
} from "ffmpeg-kit-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CurrentlyPlayingBar: React.FC = () => {
  const segments = useSegments();
  const {
    currentlyPlaying,
    pauseVideo,
    playVideo,
    setCurrentlyPlayingState,
    stopPlayback,
    setIsPlaying,
    isPlaying,
    videoRef,
    onProgress,
  } = usePlayback();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

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

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [ffmpegSession, setFfmpegSession] = useState<FFmpegSession | null>(
    null
  );

  const startStreamingTranscode = async (inputUrl: string) => {
    const outputDir = `${FileSystem.cacheDirectory}stream_${Date.now()}`;
    const manifestPath = `${outputDir}/stream.m3u8`;

    // Ensure the output directory exists
    await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });

    // Base FFmpeg command
    let ffmpegCommand = `-i "${inputUrl}" `;

    // Add hardware acceleration based on platform
    if (Platform.OS === "android") {
      ffmpegCommand += "-c:v h264_mediacodec "; // Hardware acceleration for Android
    } else if (Platform.OS === "ios") {
      ffmpegCommand += "-c:v h264_videotoolbox "; // Hardware acceleration for iOS
    } else {
      ffmpegCommand += "-c:v libx264 "; // Fallback to software encoding
    }

    // Complete the command
    ffmpegCommand += `-c:a aac -f hls -hls_time 4 -hls_list_size 5 -hls_flags delete_segments "${manifestPath}"`;

    console.log("FFmpeg command:", ffmpegCommand);

    // Start FFmpeg process and return the session
    return FFmpegKit.executeAsync(ffmpegCommand);
  };

  useEffect(() => {
    const prepareStream = async () => {
      if (currentlyPlaying?.url) {
        try {
          // Check if we already have a stream for this URL
          const existingStream = await AsyncStorage.getItem(
            currentlyPlaying.url
          );
          if (existingStream) {
            setStreamUrl(existingStream);
          } else {
            const session = await startStreamingTranscode(currentlyPlaying.url);
            setFfmpegSession(session);

            const returnCode = await session.getReturnCode();

            if (ReturnCode.isSuccess(returnCode)) {
              console.log("Transcoding completed successfully");
              const outputDir = `${
                FileSystem.cacheDirectory
              }stream_${Date.now()}`;
              const manifestPath = `${outputDir}/stream.m3u8`;
              setStreamUrl(manifestPath);
              // Store the stream URL
              await AsyncStorage.setItem(currentlyPlaying.url, manifestPath);
            } else {
              console.error("Transcoding failed");
              // Handle failure (e.g., retry or show error message)
            }
          }
        } catch (error) {
          console.error("Error preparing stream:", error);
        }
      }
    };

    prepareStream();

    return () => {
      // Cleanup: cancel FFmpeg session when component unmounts
      if (ffmpegSession) {
        ffmpegSession.cancel();
      }
    };
  }, [currentlyPlaying?.url]);

  // Cleanup function
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (streamUrl) {
          try {
            // Remove the stream URL from AsyncStorage
            await AsyncStorage.removeItem(currentlyPlaying?.url || "");
            // Delete the stream files
            await FileSystem.deleteAsync(streamUrl.replace("file://", ""), {
              idempotent: true,
            });
          } catch (error) {
            console.error("Error cleaning up stream:", error);
          }
        }
      };
      cleanup();
    };
  }, [streamUrl, currentlyPlaying?.url]);

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

  const startPosition = useMemo(
    () =>
      currentlyPlaying?.item?.UserData?.PlaybackPositionTicks
        ? Math.round(
            currentlyPlaying?.item.UserData.PlaybackPositionTicks / 10000
          )
        : 0,
    [currentlyPlaying?.item]
  );

  const backdropUrl = useMemo(
    () =>
      getBackdropUrl({
        api,
        item: currentlyPlaying?.item,
        quality: 70,
        width: 200,
      }),
    [currentlyPlaying?.item, api]
  );

  if (!api || !currentlyPlaying) return null;

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
                ${
                  currentlyPlaying.item?.Type === "Audio"
                    ? "aspect-square"
                    : "aspect-video"
                }
                `}
            >
              {streamUrl && (
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
                    backdropUrl && currentlyPlaying.item?.Type === "Audio"
                      ? backdropUrl
                      : undefined
                  }
                  debug={{
                    enable: true,
                    thread: true,
                  }}
                  paused={!isPlaying}
                  onProgress={(e) => onProgress(e)}
                  subtitleStyle={{
                    fontSize: 16,
                  }}
                  source={{
                    uri: streamUrl,
                    isNetwork: true,
                    startPosition,
                    headers: getAuthHeaders(api),
                  }}
                  onBuffer={(e) =>
                    e.isBuffering ? console.log("Buffering...") : null
                  }
                  onFullscreenPlayerDidDismiss={() => {}}
                  onFullscreenPlayerDidPresent={() => {}}
                  onPlaybackStateChanged={(e) => {
                    if (e.isPlaying) {
                      setIsPlaying(true);
                    } else if (e.isSeeking) {
                      return;
                    } else {
                      setIsPlaying(false);
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
            </TouchableOpacity>
            <View className="shrink text-xs">
              <TouchableOpacity
                onPress={() => {
                  if (currentlyPlaying.item?.Type === "Audio")
                    router.push(`/albums/${currentlyPlaying.item?.AlbumId}`);
                  else router.push(`/items/${currentlyPlaying.item?.Id}`);
                }}
              >
                <Text>{currentlyPlaying.item?.Name}</Text>
              </TouchableOpacity>
              {currentlyPlaying.item?.Type === "Episode" && (
                <TouchableOpacity
                  onPress={() => {
                    router.push(
                      `/(auth)/series/${currentlyPlaying.item.SeriesId}`
                    );
                  }}
                  className="text-xs opacity-50"
                >
                  <Text>{currentlyPlaying.item.SeriesName}</Text>
                </TouchableOpacity>
              )}
              {currentlyPlaying.item?.Type === "Movie" && (
                <View>
                  <Text className="text-xs opacity-50">
                    {currentlyPlaying.item?.ProductionYear}
                  </Text>
                </View>
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
          </View>
          <View className="flex flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => {
                if (isPlaying) pauseVideo();
                else playVideo();
              }}
              className="aspect-square rounded flex flex-col items-center justify-center p-2"
            >
              {isPlaying ? (
                <Ionicons name="pause" size={24} color="white" />
              ) : (
                <Ionicons name="play" size={24} color="white" />
              )}
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
      </BlurView>
    </Animated.View>
  );
};
