import { Controls } from "@/components/video-player/controls/Controls";
import { useOrientation } from "@/hooks/useOrientation";
import { useOrientationSettings } from "@/hooks/useOrientationSettings";
import { VlcPlayerView } from "@/modules/vlc-player";
import {
  PlaybackStatePayload,
  ProgressUpdatePayload,
  VlcPlayerViewRef,
} from "@/modules/vlc-player/src/VlcPlayer.types";
import { apiAtom } from "@/providers/JellyfinProvider";
import { usePlaySettings } from "@/providers/PlaySettingsProvider";
import { useSettings } from "@/utils/atoms/settings";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useAtomValue } from "jotai";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { useSharedValue } from "react-native-reanimated";
import { SelectedTrackType } from "react-native-video";

const OfflinePlayer = () => {
  const { playSettings, playUrl } = usePlaySettings();
  const api = useAtomValue(apiAtom);
  const [settings] = useSettings();
  const videoRef = useRef<VlcPlayerViewRef>(null);

  const dimensions = useWindowDimensions();
  useOrientation();
  useOrientationSettings();

  const [isPlaybackStopped, setIsPlaybackStopped] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ignoreSafeAreas, setIgnoreSafeAreas] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  const progress = useSharedValue(0);
  const isSeeking = useSharedValue(false);
  const cacheProgress = useSharedValue(0);

  const [playbackState, setPlaybackState] = useState<
    PlaybackStatePayload["nativeEvent"] | null
  >(null);

  if (!playSettings || !playUrl || !api || !playSettings.item) return null;

  const togglePlay = useCallback(
    async (ticks: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isPlaying) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play();
      }
    },
    [isPlaying, api, playSettings?.item?.Id, videoRef, settings]
  );

  const play = useCallback(() => {
    videoRef.current?.play();
  }, [videoRef]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, [videoRef]);

  const stop = useCallback(() => {
    setIsPlaybackStopped(true);
    videoRef.current?.stop();
  }, [videoRef]);

  const onProgress = useCallback(
    async (data: ProgressUpdatePayload) => {
      if (isSeeking.value === true) return;
      if (isPlaybackStopped === true) return;

      const { currentTime, duration, isBuffering, isPlaying } =
        data.nativeEvent;

      progress.value = currentTime;

      // cacheProgress.value = secondsToTicks(data.playableDuration);
      // setIsBuffering(data.playableDuration === 0);
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

  useOrientation();
  useOrientationSettings();

  const selectedSubtitleTrack = useMemo(() => {
    const a = playSettings?.mediaSource?.MediaStreams?.find(
      (s) => s.Index === playSettings.subtitleIndex
    );
    console.log(a);
    return a;
  }, [playSettings]);

  const [hlsSubTracks, setHlsSubTracks] = useState<
    {
      index: number;
      language?: string | undefined;
      selected?: boolean | undefined;
      title?: string | undefined;
      type: any;
    }[]
  >([]);

  const selectedTextTrack = useMemo(() => {
    for (let st of hlsSubTracks) {
      if (st.title === selectedSubtitleTrack?.DisplayTitle) {
        return {
          type: SelectedTrackType.TITLE,
          value: selectedSubtitleTrack?.DisplayTitle ?? "",
        };
      }
    }
    return undefined;
  }, [hlsSubTracks]);

  const onPlaybackStateChanged = (e: PlaybackStatePayload) => {
    const { target, state, isBuffering, isPlaying } = e.nativeEvent;

    if (state === "Playing") {
      setIsPlaying(true);
      return;
    }

    if (state === "Paused") {
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      setIsPlaying(true);
      setIsBuffering(false);
    } else if (isBuffering) {
      setIsBuffering(true);
    }

    setPlaybackState(e.nativeEvent);
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  useEffect(() => {
    console.log(playUrl);
  }, [playUrl]);

  return (
    <View
      style={{
        width: dimensions.width,
        height: dimensions.height,
        position: "relative",
      }}
      className="flex flex-col items-center justify-center"
    >
      <Pressable
        onPress={() => {
          setShowControls(!showControls);
        }}
        className="absolute z-0 h-full w-full"
      >
        <VlcPlayerView
          ref={videoRef}
          source={{
            uri: playUrl,
            autoplay: true,
            isNetwork: false,
            initOptions: ["--sub-text-scale=60"],
          }}
          style={{ width: "100%", height: "100%" }}
          onVideoProgress={onProgress}
          progressUpdateInterval={1000}
          onVideoStateChange={onPlaybackStateChanged}
        />
      </Pressable>
      {videoRef.current && (
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
          enableTrickplay={false}
          offline={true}
          play={play}
          pause={pause}
          stop={stop}
          seek={videoRef.current?.seekTo}
          isVlc
          getAudioTracks={videoRef.current?.getAudioTracks}
          getSubtitleTracks={videoRef.current?.getSubtitleTracks}
          setAudioTrack={videoRef.current?.setAudioTrack}
          setSubtitleTrack={videoRef.current?.setSubtitleTrack}
          setSubtitleURL={videoRef.current?.setSubtitleURL}
        />
      )}
    </View>
  );
};

export default OfflinePlayer;
