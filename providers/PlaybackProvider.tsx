import { useQuery } from "@tanstack/react-query";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
import { getDeviceId } from "@/utils/device";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

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
  stopPlayback: () => void;
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

  // WS
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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

  const { data: deviceId } = useQuery({
    queryKey: ["deviceId", api],
    queryFn: getDeviceId,
  });

  const setCurrentlyPlayingState = useCallback(
    (state: CurrentlyPlayingState | null) => {
      const vlcLink = "vlc://" + state?.url;
      console.log(vlcLink, settings?.openInVLC, Platform.OS === "ios");
      if (vlcLink && settings?.openInVLC) {
        Linking.openURL("vlc://" + state?.url || "");
        return;
      }

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
    },
    [settings]
  );

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

  const stopPlayback = useCallback(async () => {
    await reportPlaybackStopped({
      api,
      itemId: currentlyPlaying?.item?.Id,
      sessionId: sessionData?.PlaySessionId,
      positionTicks: progressTicks ? progressTicks : 0,
    });
    setCurrentlyPlayingState(null);
  }, [currentlyPlaying, sessionData, progressTicks]);

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

  useEffect(() => {
    if (!deviceId || !api?.accessToken) return;

    const protocol = api?.basePath.includes('https') ? 'wss' : 'ws'

    const url = `${protocol}://${api?.basePath
      .replace("https://", "")
      .replace("http://", "")}/socket?api_key=${
      api?.accessToken
    }&deviceId=${deviceId}`;

    console.log(protocol, url);

    const newWebSocket = new WebSocket(url);

    let keepAliveInterval: NodeJS.Timeout | null = null;

    newWebSocket.onopen = () => {
      setIsConnected(true);
      // Start sending "KeepAlive" message every 30 seconds
      keepAliveInterval = setInterval(() => {
        if (newWebSocket.readyState === WebSocket.OPEN) {
          newWebSocket.send(JSON.stringify({ MessageType: "KeepAlive" }));
          console.log("KeepAlive message sent");
        }
      }, 30000);
    };

    newWebSocket.onerror = (e) => {
      console.error("WebSocket error:", e);
      setIsConnected(false);
    };

    newWebSocket.onclose = (e) => {
      console.log("WebSocket connection closed:", e.reason);
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };

    setWs(newWebSocket);

    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      newWebSocket.close();
    };
  }, [api, deviceId, user]);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (e) => {
      const json = JSON.parse(e.data);
      const command = json?.Data?.Command;

      // On PlayPause
      if (command === "PlayPause") {
        console.log("Command ~ PlayPause");
        if (isPlaying) pauseVideo();
        else playVideo();
      } else if (command === "Stop") {
        console.log("Command ~ Stop");
        stopPlayback();
      }
    };
  }, [ws, stopPlayback, playVideo, pauseVideo]);

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
        stopPlayback,
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
