import { Controls } from "@/components/video-player/Controls";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  PlaybackType,
  usePlaySettings,
} from "@/providers/PlaySettingsProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { reportPlaybackProgress } from "@/utils/jellyfin/playstate/reportPlaybackProgress";
import orientationToOrientationLock from "@/utils/OrientationLockConverter";
import { secondsToTicks } from "@/utils/secondsToTicks";
import { Api } from "@jellyfin/sdk";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAtom } from "jotai";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Pressable, StatusBar, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Video, { OnProgressData, VideoRef } from "react-native-video";

export default function page() {
  const { playSettings, setPlaySettings, playUrl, reportStopPlayback } =
    usePlaySettings();
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [settings] = useSettings();
  const router = useRouter();
  const videoRef = useRef<VideoRef | null>(null);
  const poster = usePoster(playSettings, api);
  const videoSource = useVideoSource(playSettings, api, poster, playUrl);

  const windowDimensions = Dimensions.get("window");
  const screenDimensions = Dimensions.get("screen");

  const [showControls, setShowControls] = useState(true);
  const [ignoreSafeAreas, setIgnoreSafeAreas] = useState(false);
  const [ignoreSafeArea, setIgnoreSafeArea] = useState(false);
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
    (ticks: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log("togglePlay", ticks);
      if (isPlaying) {
        setIsPlaying(false);
        videoRef.current?.pause();
        reportPlaybackProgress({
          api,
          itemId: playSettings?.item?.Id,
          positionTicks: ticks,
          sessionId: undefined,
          IsPaused: true,
        });
      } else {
        setIsPlaying(true);
        videoRef.current?.resume();
        reportPlaybackProgress({
          api,
          itemId: playSettings?.item?.Id,
          positionTicks: ticks,
          sessionId: undefined,
          IsPaused: false,
        });
      }
    },
    [isPlaying, api, playSettings?.item?.Id, videoRef]
  );

  const play = useCallback(() => {
    setIsPlaying(true);
    videoRef.current?.resume();
  }, [videoRef]);

  useEffect(() => {
    play();
  }, []);

  const onProgress = useCallback(
    (data: OnProgressData) => {
      if (isSeeking.value === true) return;

      progress.value = secondsToTicks(data.currentTime);
      cacheProgress.value = secondsToTicks(data.playableDuration);
      setIsBuffering(data.playableDuration === 0);

      if (!playSettings?.item?.Id || data.currentTime === 0) return;
      const ticks = data.currentTime * 10000000;
      reportPlaybackProgress({
        api,
        itemId: playSettings?.item.Id,
        positionTicks: ticks,
        sessionId: undefined,
        IsPaused: !isPlaying,
      });
    },
    [playSettings?.item.Id, isPlaying, api]
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

  const isLandscape = useMemo(() => {
    return orientation === ScreenOrientation.OrientationLock.LANDSCAPE_LEFT ||
      orientation === ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
      ? true
      : false;
  }, [orientation]);

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
        isLandscape={isLandscape}
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
