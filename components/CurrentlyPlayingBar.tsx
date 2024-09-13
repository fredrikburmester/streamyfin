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
  withDecay,
  withTiming,
} from "react-native-reanimated";
import Video from "react-native-video";
import { Text } from "./common/Text";
import { Loader } from "./Loader";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  const screenHeight = Dimensions.get("window").height;
  const screenWiidth = Dimensions.get("window").width;

  const backgroundValues = useSharedValue({
    bottom: 70,
    height: 80,
    padding: 0,
    width: screenWiidth - 100,
    left: 50,
  });

  const videoValues = useSharedValue({
    bottom: 90,
    height: 70,
    width: 125,
    left: 16,
  });

  const buttonsValues = useSharedValue({
    bottom: 90,
    opacity: 1,
    right: 16,
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      bottom: withTiming(buttonsValues.value.bottom, { duration: 500 }),
      opacity: withTiming(buttonsValues.value.opacity, { duration: 500 }),
      right: withTiming(buttonsValues.value.right, { duration: 500 }),
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      bottom: withTiming(backgroundValues.value.bottom, { duration: 500 }),
      width: withTiming(backgroundValues.value.width, { duration: 500 }),
      height: withTiming(backgroundValues.value.height, { duration: 500 }),
      padding: withTiming(backgroundValues.value.padding, { duration: 500 }),
      left: withTiming(backgroundValues.value.left, { duration: 500 }),
    };
  });

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

  const animatedVideoStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(videoValues.value.height, { duration: 500 }),
      width: withTiming(videoValues.value.width, { duration: 500 }),
      bottom: withTiming(videoValues.value.bottom, { duration: 500 }),
      left: withTiming(videoValues.value.left, { duration: 500 }),
    };
  });

  const animatedValues = useSharedValue({
    paddingBottom: 0,
    paddingInner: 0,
    borderRadiusBottom: 0,
  });

  useEffect(() => {
    if (size === "full") {
      backgroundValues.value = {
        bottom: 0,
        height: screenHeight,
        padding: 0,
        width: screenWiidth,
        left: 0,
      };
      buttonsValues.value = {
        bottom: screenHeight - insets.top - 38,
        opacity: 1,
        right: 16,
      };
      videoValues.value = {
        bottom: 0,
        height: screenHeight,
        width: screenWiidth,
        left: 0,
      };
    } else {
      backgroundValues.value = {
        bottom: 70,
        height: 80,
        padding: 0,
        width: screenWiidth - 16,
        left: 8,
      };
      buttonsValues.value = {
        bottom: 90,
        opacity: 1,
        right: 16,
      };
      videoValues.value = {
        bottom: 78,
        height: 64,
        width: 113,
        left: 16,
      };
    }
  }, [size, screenHeight, insets]);

  if (!api || !currentlyPlaying) return null;

  return (
    <>
      <Animated.View
        className={`bg-black rounded-lg absolute`}
        style={[animatedBackgroundStyle]}
      ></Animated.View>

      <Animated.View
        className={`flex flex-row items-center z-10`}
        style={[
          { position: "absolute", borderWidth: 1, borderColor: "blue" },
          animatedButtonStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (size === "small") setSize("full");
            else setSize("small");
          }}
          className="aspect-square rounded flex flex-col items-center justify-center p-2"
        >
          <Ionicons name="expand" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            stopPlayback();
          }}
          className="aspect-square rounded flex flex-col items-center justify-center p-2"
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[animatedVideoStyle]}
        className={` rounded-md absolute overflow-hidden flex flex-col items-center justify-center pointer-events-none z-0`}
      >
        <View className="">
          {videoSource && (
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
              debug={{
                enable: true,
                thread: true,
              }}
              onProgress={(e) => onProgress(e)}
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
        </View>
      </Animated.View>

      {/* <Animated.View
        style={[
          {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            overflow: "hidden",
          },
          animatedInnerStyle,
        ]}
      >
        
        <View
          className={`flex flex-row w-full h-full items-center space-x-4 shrink bg-neutral-800 rounded-lg p-2`}
        >
         
        </View>
      </Animated.View> */}
    </>
  );
};
