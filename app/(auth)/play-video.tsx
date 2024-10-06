import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { settingsAtom, useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { Api } from "@jellyfin/sdk";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client";
import { useRouter } from "expo-router";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Video, { OnProgressData, VideoRef } from "react-native-video";
import settings from "./(tabs)/(home)/settings";
import iosFmp4 from "@/utils/profiles/iosFmp4";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";
import {
  PlaybackType,
  usePlaySettings,
} from "@/providers/PlaySettingsProvider";
import { StatusBar, View } from "react-native";
import React from "react";
import { Controls } from "@/components/video-player/Controls";
import { reportPlaybackProgress } from "@/utils/jellyfin/playstate/reportPlaybackProgress";
import { useSharedValue } from "react-native-reanimated";
import { secondsToTicks } from "@/utils/secondsToTicks";

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

  const [ignoreSafeArea, setIgnoreSafeArea] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  const progress = useSharedValue(0);
  const isSeeking = useSharedValue(false);
  const cacheProgress = useSharedValue(0);

  useEffect(() => {
    console.log("play-video ~", playUrl);
  });

  if (!playSettings || !playUrl || !api || !videoSource || !playSettings.item)
    return null;

  const togglePlay = useCallback(
    (ticks: number) => {
      if (isPlaying) {
        videoRef.current?.pause();
        reportPlaybackProgress({
          api,
          itemId: playSettings?.item?.Id,
          positionTicks: ticks,
          sessionId: undefined,
          IsPaused: true,
        });
      } else {
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

  useEffect(() => {
    if (!isPlaying) {
      togglePlay(playSettings.item?.UserData?.PlaybackPositionTicks || 0);
    }
  }, [isPlaying]);

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

  return (
    <View className="relative h-screen w-screen flex flex-col items-center justify-center">
      <StatusBar hidden />
      <Video
        ref={videoRef}
        source={videoSource}
        paused={!isPlaying}
        style={{ width: "100%", height: "100%" }}
        resizeMode={ignoreSafeArea ? "cover" : "contain"}
        onProgress={onProgress}
        onLoad={(data) => {}}
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
      <Controls
        item={playSettings.item}
        videoRef={videoRef}
        togglePlay={togglePlay}
        isPlaying={isPlaying}
        isSeeking={isSeeking}
        progress={progress}
        cacheProgress={cacheProgress}
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
