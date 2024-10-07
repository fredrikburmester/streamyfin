import { Controls } from "@/components/video-player/Controls";
import { useWebSocket } from "@/hooks/useWebsockets";
import { apiAtom } from "@/providers/JellyfinProvider";
import {
  PlaybackType,
  usePlaySettings,
} from "@/providers/PlaySettingsProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import orientationToOrientationLock from "@/utils/OrientationLockConverter";
import { secondsToTicks } from "@/utils/secondsToTicks";
import { Api } from "@jellyfin/sdk";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAtomValue } from "jotai";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Platform, Pressable, StatusBar, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Video, { OnProgressData, VideoRef } from "react-native-video";
import * as NavigationBar from "expo-navigation-bar";
import { useFocusEffect } from "expo-router";

export default function page() {
  const { playSettings, playUrl, playSessionId } = usePlaySettings();
  const api = useAtomValue(apiAtom);
  const [settings] = useSettings();
  const videoRef = useRef<VideoRef | null>(null);
  const poster = usePoster(playSettings, api);
  const videoSource = useVideoSource(playSettings, api, poster, playUrl);
  const firstTime = useRef(true);

  const screenDimensions = Dimensions.get("screen");

  const [isPlaybackStopped, setIsPlaybackStopped] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ignoreSafeAreas, setIgnoreSafeAreas] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [orientation, setOrientation] = useState(
    ScreenOrientation.OrientationLock.UNKNOWN
  );

  const progress = useSharedValue(0);
  const isSeeking = useSharedValue(false);
  const cacheProgress = useSharedValue(0);

  if (!playSettings || !playUrl || !api || !videoSource || !playSettings.item)
    return null;

  const togglePlay = useCallback(
    async (ticks: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isPlaying) {
        setIsPlaying(false);
        videoRef.current?.pause();
        await getPlaystateApi(api).onPlaybackProgress({
          itemId: playSettings.item?.Id!,
          audioStreamIndex: playSettings.audioIndex
            ? playSettings.audioIndex
            : undefined,
          subtitleStreamIndex: playSettings.subtitleIndex
            ? playSettings.subtitleIndex
            : undefined,
          mediaSourceId: playSettings.mediaSource?.Id!,
          positionTicks: Math.floor(ticks),
          isPaused: true,
          playMethod: playUrl.includes("m3u8") ? "Transcode" : "DirectStream",
          playSessionId: playSessionId ? playSessionId : undefined,
        });
      } else {
        setIsPlaying(true);
        videoRef.current?.resume();
        await getPlaystateApi(api).onPlaybackProgress({
          itemId: playSettings.item?.Id!,
          audioStreamIndex: playSettings.audioIndex
            ? playSettings.audioIndex
            : undefined,
          subtitleStreamIndex: playSettings.subtitleIndex
            ? playSettings.subtitleIndex
            : undefined,
          mediaSourceId: playSettings.mediaSource?.Id!,
          positionTicks: Math.floor(ticks),
          isPaused: false,
          playMethod: playUrl.includes("m3u8") ? "Transcode" : "DirectStream",
          playSessionId: playSessionId ? playSessionId : undefined,
        });
      }
    },
    [isPlaying, api, playSettings?.item?.Id, videoRef, settings]
  );

  const play = useCallback(() => {
    setIsPlaying(true);
    videoRef.current?.resume();
    reportPlaybackStart();
  }, [videoRef]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    videoRef.current?.pause();
  }, [videoRef]);

  const stop = useCallback(() => {
    setIsPlaybackStopped(true);
    setIsPlaying(false);
    videoRef.current?.pause();
    reportPlaybackStopped();
  }, [videoRef]);

  const reportPlaybackStopped = async () => {
    await getPlaystateApi(api).onPlaybackStopped({
      itemId: playSettings?.item?.Id!,
      mediaSourceId: playSettings.mediaSource?.Id!,
      positionTicks: Math.floor(progress.value),
      playSessionId: playSessionId ? playSessionId : undefined,
    });
  };

  const reportPlaybackStart = async () => {
    await getPlaystateApi(api).onPlaybackStart({
      itemId: playSettings?.item?.Id!,
      audioStreamIndex: playSettings.audioIndex
        ? playSettings.audioIndex
        : undefined,
      subtitleStreamIndex: playSettings.subtitleIndex
        ? playSettings.subtitleIndex
        : undefined,
      mediaSourceId: playSettings.mediaSource?.Id!,
      playMethod: playUrl.includes("m3u8") ? "Transcode" : "DirectStream",
      playSessionId: playSessionId ? playSessionId : undefined,
    });
  };

  const onProgress = useCallback(
    async (data: OnProgressData) => {
      if (isSeeking.value === true) return;
      if (isPlaybackStopped) return;

      const ticks = data.currentTime * 10000000;

      progress.value = secondsToTicks(data.currentTime);
      cacheProgress.value = secondsToTicks(data.playableDuration);
      setIsBuffering(data.playableDuration === 0);

      if (!playSettings?.item?.Id || data.currentTime === 0) return;

      await getPlaystateApi(api).onPlaybackProgress({
        itemId: playSettings.item.Id,
        audioStreamIndex: playSettings.audioIndex
          ? playSettings.audioIndex
          : undefined,
        subtitleStreamIndex: playSettings.subtitleIndex
          ? playSettings.subtitleIndex
          : undefined,
        mediaSourceId: playSettings.mediaSource?.Id!,
        positionTicks: Math.round(ticks),
        isPaused: !isPlaying,
        playMethod: playUrl.includes("m3u8") ? "Transcode" : "DirectStream",
        playSessionId: playSessionId ? playSessionId : undefined,
      });
    },
    [playSettings?.item.Id, isPlaying, api, isPlaybackStopped]
  );

  useFocusEffect(
    useCallback(() => {
      play();

      return () => {
        stop();
      };
    }, [play, stop])
  );

  useEffect(() => {
    const orientationSubscription =
      ScreenOrientation.addOrientationChangeListener((event) => {
        setOrientation(
          orientationToOrientationLock(event.orientationInfo.orientation)
        );
      });

    ScreenOrientation.getOrientationAsync().then((orientation) => {
      setOrientation(orientationToOrientationLock(orientation));
    });

    return () => {
      orientationSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (settings?.autoRotate) {
      // Don't need to do anything
    } else if (settings?.defaultVideoOrientation) {
      ScreenOrientation.lockAsync(settings.defaultVideoOrientation);
    }

    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }

    return () => {
      if (settings?.autoRotate) {
        ScreenOrientation.unlockAsync();
      } else {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      }

      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible");
        NavigationBar.setBehaviorAsync("inset-swipe");
      }
    };
  }, [settings]);

  useWebSocket({
    isPlaying: isPlaying,
    pauseVideo: pause,
    playVideo: play,
    stopPlayback: stop,
  });

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
          paused={!isPlaying}
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
          progressUpdateInterval={500}
          playWhenInactive={true}
          allowsExternalPlayback={true}
          playInBackground={true}
          pictureInPicture={true}
          showNotificationControls={true}
          ignoreSilentSwitch="ignore"
          fullscreen={false}
          onPlaybackStateChanged={(state) => setIsPlaying(state.isPlaying)}
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

export function usePoster(
  playSettings: PlaybackType | null,
  api: Api | null
): string | undefined {
  const poster = useMemo(() => {
    if (!playSettings?.item || !api) return undefined;
    return playSettings.item.Type === "Audio"
      ? `${api.basePath}/Items/${playSettings.item.AlbumId}/Images/Primary?tag=${playSettings.item.AlbumPrimaryImageTag}&quality=90&maxHeight=200&maxWidth=200`
      : getBackdropUrl({
          api,
          item: playSettings.item,
          quality: 70,
          width: 200,
        });
  }, [playSettings?.item, api]);

  return poster ?? undefined;
}

export function useVideoSource(
  playSettings: PlaybackType | null,
  api: Api | null,
  poster: string | undefined,
  playUrl?: string | null
) {
  const videoSource = useMemo(() => {
    if (!playSettings || !api || !playUrl) {
      return null;
    }

    const startPosition = playSettings.item?.UserData?.PlaybackPositionTicks
      ? Math.round(playSettings.item.UserData.PlaybackPositionTicks / 10000)
      : 0;

    return {
      uri: playUrl,
      isNetwork: true,
      startPosition,
      headers: getAuthHeaders(api),
      metadata: {
        artist: playSettings.item?.AlbumArtist ?? undefined,
        title: playSettings.item?.Name || "Unknown",
        description: playSettings.item?.Overview ?? undefined,
        imageUri: poster,
        subtitle: playSettings.item?.Album ?? undefined,
      },
    };
  }, [playSettings, api, poster]);

  return videoSource;
}
