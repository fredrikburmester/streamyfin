import { useQuery } from "@tanstack/react-query";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { useSettings } from "@/utils/atoms/settings";
import { reportPlaybackProgress } from "@/utils/jellyfin/playstate/reportPlaybackProgress";
import { reportPlaybackStopped } from "@/utils/jellyfin/playstate/reportPlaybackStopped";
import {
  BaseItemDto,
  PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { useAtom } from "jotai";
import { OnProgressData, type VideoRef } from "react-native-video";
import { apiAtom, userAtom } from "./JellyfinProvider";

type CurrentlyPlayingState = {
  url: string;
  item: BaseItemDto;
};

interface PlaybackContextType {
  sessionData: PlaybackInfoResponse | null | undefined;
  currentlyPlaying: CurrentlyPlayingState | null;
  videoRef: React.MutableRefObject<VideoRef | null>;
  isPlaying: boolean;
  isFullscreen: boolean;
  progressTicks: number | null;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  presentFullscreenPlayer: () => void;
  dismissFullscreenPlayer: () => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  onProgress: (data: OnProgressData) => void;
  setCurrentlyPlayingState: (
    currentlyPlaying: CurrentlyPlayingState | null
  ) => void;
}

const PlaybackContext = createContext<PlaybackContextType | null>(null);

export const PlaybackProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const videoRef = useRef<VideoRef | null>(null);

  const [settings] = useSettings();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [progressTicks, setProgressTicks] = useState<number | null>(0);
  const [currentlyPlaying, setCurrentlyPlaying] =
    useState<CurrentlyPlayingState | null>(null);

  const { data: sessionData } = useQuery({
    queryKey: ["sessionData", currentlyPlaying?.item.Id, user?.Id, api],
    queryFn: async () => {
      if (!currentlyPlaying?.item.Id) return null;
      const playbackData = await getMediaInfoApi(api!).getPlaybackInfo({
        itemId: currentlyPlaying?.item.Id,
        userId: user?.Id,
      });
      return playbackData.data;
    },
    enabled: !!currentlyPlaying?.item.Id && !!api && !!user?.Id,
  });

  const setCurrentlyPlayingState = (state: CurrentlyPlayingState | null) => {
    if (state) {
      setCurrentlyPlaying(state);
      setIsPlaying(true);

      if (settings?.openFullScreenVideoPlayerByDefault)
        presentFullscreenPlayer();
    } else {
      setCurrentlyPlaying(null);
      setIsFullscreen(false);
      setIsPlaying(false);
    }
  };

  // Define control methods
  const playVideo = useCallback(() => {
    videoRef.current?.resume();
    setIsPlaying(true);
    reportPlaybackProgress({
      api,
      itemId: currentlyPlaying?.item.Id,
      positionTicks: progressTicks ? progressTicks : 0,
      sessionId: sessionData?.PlaySessionId,
      IsPaused: true,
    });
  }, [
    api,
    currentlyPlaying?.item.Id,
    sessionData?.PlaySessionId,
    progressTicks,
  ]);

  const pauseVideo = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
    reportPlaybackProgress({
      api,
      itemId: currentlyPlaying?.item.Id,
      positionTicks: progressTicks ? progressTicks : 0,
      sessionId: sessionData?.PlaySessionId,
      IsPaused: false,
    });
  }, [sessionData?.PlaySessionId, currentlyPlaying?.item.Id, progressTicks]);

  const stopVideo = useCallback(() => {
    reportPlaybackStopped({
      api,
      itemId: currentlyPlaying?.item?.Id,
      sessionId: sessionData?.PlaySessionId,
      positionTicks: progressTicks ? progressTicks : 0,
    });
  }, [currentlyPlaying?.item?.Id, sessionData?.PlaySessionId, progressTicks]);

  const onProgress = useCallback(
    ({ currentTime }: OnProgressData) => {
      const ticks = currentTime * 10000000;
      setProgressTicks(ticks);
      reportPlaybackProgress({
        api,
        itemId: currentlyPlaying?.item.Id,
        positionTicks: ticks,
        sessionId: sessionData?.PlaySessionId,
        IsPaused: !isPlaying,
      });
    },
    [sessionData?.PlaySessionId, currentlyPlaying?.item.Id, isPlaying]
  );

  const presentFullscreenPlayer = useCallback(() => {
    videoRef.current?.presentFullscreenPlayer();
    setIsFullscreen(true);
  }, []);

  const dismissFullscreenPlayer = useCallback(() => {
    videoRef.current?.dismissFullscreenPlayer();
    setIsFullscreen(false);
  }, []);

  return (
    <PlaybackContext.Provider
      value={{
        onProgress,
        progressTicks,
        setIsPlaying,
        setIsFullscreen,
        isFullscreen,
        isPlaying,
        currentlyPlaying,
        sessionData,
        videoRef,
        playVideo,
        setCurrentlyPlayingState,
        pauseVideo,
        stopVideo,
        presentFullscreenPlayer,
        dismissFullscreenPlayer,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const context = useContext(PlaybackContext);

  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }

  return context;
};
