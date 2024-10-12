import { Controls } from "@/components/video-player/Controls";
import { useAndroidNavigationBar } from "@/hooks/useAndroidNavigationBar";
import { useOrientation } from "@/hooks/useOrientation";
import { useOrientationSettings } from "@/hooks/useOrientationSettings";
import useScreenDimensions from "@/hooks/useScreenDimensions";
import { apiAtom } from "@/providers/JellyfinProvider";
import {
  PlaybackType,
  usePlaySettings,
} from "@/providers/PlaySettingsProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import orientationToOrientationLock from "@/utils/OrientationLockConverter";
import { secondsToTicks } from "@/utils/secondsToTicks";
import { Api } from "@jellyfin/sdk";
import * as Haptics from "expo-haptics";
import * as NavigationBar from "expo-navigation-bar";
import { useFocusEffect } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAtomValue } from "jotai";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Platform, Pressable, StatusBar, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Video, { OnProgressData, VideoRef } from "react-native-video";

export default function page() {
  const { playSettings, playUrl } = usePlaySettings();

  const api = useAtomValue(apiAtom);
  const videoRef = useRef<VideoRef | null>(null);
  const videoSource = useVideoSource(playSettings, api, playUrl);
  const firstTime = useRef(true);

  const screenDimensions = useScreenDimensions();
  useOrientation();
  useOrientationSettings();
  useAndroidNavigationBar();

  const [showControls, setShowControls] = useState(true);
  const [ignoreSafeAreas, setIgnoreSafeAreas] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  const progress = useSharedValue(0);
  const isSeeking = useSharedValue(false);
  const cacheProgress = useSharedValue(0);

  const togglePlay = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.resume();
    }
  }, [isPlaying]);

  const play = useCallback(() => {
    setIsPlaying(true);
    videoRef.current?.resume();
  }, [videoRef]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    videoRef.current?.pause();
  }, [videoRef]);

  useFocusEffect(
    useCallback(() => {
      play();

      return () => {
        stop();
      };
    }, [play, stop])
  );

  const onProgress = useCallback(async (data: OnProgressData) => {
    if (isSeeking.value === true) return;
    progress.value = secondsToTicks(data.currentTime);
    cacheProgress.value = secondsToTicks(data.playableDuration);
    setIsBuffering(data.playableDuration === 0);
  }, []);

  if (!playSettings || !playUrl || !api || !videoSource || !playSettings.item)
    return null;

  return (
    <View
      style={{
        width: screenDimensions.width,
        height: screenDimensions.height,
        position: "relative",
      }}
      className="flex flex-col items-center justify-center"
    >
      <StatusBar hidden />
      <Pressable
        onPress={() => {
          setShowControls(!showControls);
        }}
        className="absolute z-0 h-full w-full"
      >
        <Video
          ref={videoRef}
          source={videoSource}
          style={{ width: "100%", height: "100%" }}
          resizeMode={ignoreSafeAreas ? "cover" : "contain"}
          onProgress={onProgress}
          onError={() => {}}
          onLoad={() => {
            if (firstTime.current === true) {
              play();
              firstTime.current = false;
            }
          }}
          playWhenInactive={true}
          allowsExternalPlayback={true}
          playInBackground={true}
          pictureInPicture={true}
          showNotificationControls={true}
          ignoreSilentSwitch="ignore"
          fullscreen={false}
          onPlaybackStateChanged={(state) => {
            if (isSeeking.value === false) setIsPlaying(state.isPlaying);
          }}
        />
      </Pressable>

      <Controls
        item={playSettings.item}
        videoRef={videoRef}
        togglePlay={togglePlay}
        isPlaying={isPlaying}
        isSeeking={isSeeking}
        progress={progress}
        cacheProgress={cacheProgress}
        isBuffering={isBuffering}
        showControls={showControls}
        setShowControls={setShowControls}
        setIgnoreSafeAreas={setIgnoreSafeAreas}
        ignoreSafeAreas={ignoreSafeAreas}
      />
    </View>
  );
}

export function useVideoSource(
  playSettings: PlaybackType | null,
  api: Api | null,
  playUrl?: string | null
) {
  const videoSource = useMemo(() => {
    if (!playSettings || !api || !playUrl) {
      return null;
    }

    const startPosition = 0;

    return {
      uri: playUrl,
      isNetwork: false,
      startPosition,
      metadata: {
        artist: playSettings.item?.AlbumArtist ?? undefined,
        title: playSettings.item?.Name || "Unknown",
        description: playSettings.item?.Overview ?? undefined,
        subtitle: playSettings.item?.Album ?? undefined,
      },
    };
  }, [playSettings, api]);

  return videoSource;
}
