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
import { getDeviceId } from "@/utils/device";
import { reportPlaybackProgress } from "@/utils/jellyfin/playstate/reportPlaybackProgress";
import { reportPlaybackStopped } from "@/utils/jellyfin/playstate/reportPlaybackStopped";
import { postCapabilities } from "@/utils/jellyfin/session/capabilities";
import {
  BaseItemDto,
  PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import * as Linking from "expo-linking";
import { useAtom } from "jotai";
import { debounce } from "lodash";
import { Alert, Platform } from "react-native";
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
  playVideo: (triggerRef?: boolean) => void;
  pauseVideo: (triggerRef?: boolean) => void;
  stopPlayback: () => void;
  presentFullscreenPlayer: () => void;
  dismissFullscreenPlayer: () => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  onProgress: (data: OnProgressData) => void;
  setVolume: (volume: number) => void;
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

  const previousVolume = useRef<number | null>(null);

  const [isPlaying, _setIsPlaying] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [progressTicks, setProgressTicks] = useState<number | null>(0);
  const [volume, _setVolume] = useState<number | null>(null);
  const [session, setSession] = useState<PlaybackInfoResponse | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] =
    useState<CurrentlyPlayingState | null>(null);

  // WS
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const setVolume = useCallback(
    (newVolume: number) => {
      previousVolume.current = volume;
      _setVolume(newVolume);
      videoRef.current?.setVolume(newVolume);
    },
    [_setVolume]
  );

  const { data: deviceId } = useQuery({
    queryKey: ["deviceId", api],
    queryFn: getDeviceId,
  });

  const setCurrentlyPlayingState = useCallback(
    async (state: CurrentlyPlayingState | null) => {
      if (!api) return;

      if (state && state.item.Id && user?.Id) {
        const vlcLink = "vlc://" + state?.url;
        if (vlcLink && settings?.openInVLC) {
          Linking.openURL("vlc://" + state?.url || "");
          return;
        }

        const res = await getMediaInfoApi(api).getPlaybackInfo({
          itemId: state.item.Id,
          userId: user.Id,
        });

        await postCapabilities({
          api,
          itemId: state.item.Id,
          sessionId: res.data.PlaySessionId,
        });

        setSession(res.data);
        setCurrentlyPlaying(state);
        setIsPlaying(true);

        if (settings?.openFullScreenVideoPlayerByDefault) {
          setTimeout(() => {
            presentFullscreenPlayer();
          }, 300);
        }
      } else {
        setCurrentlyPlaying(null);
        setIsFullscreen(false);
        setIsPlaying(false);
      }
    },
    [settings, user, api]
  );

  const playVideo = useCallback(
    (triggerRef: boolean = true) => {
      if (triggerRef === true) {
        videoRef.current?.resume();
      }
      _setIsPlaying(true);
      reportPlaybackProgress({
        api,
        itemId: currentlyPlaying?.item.Id,
        positionTicks: progressTicks ? progressTicks : 0,
        sessionId: session?.PlaySessionId,
        IsPaused: false,
      });
    },
    [api, currentlyPlaying?.item.Id, session?.PlaySessionId, progressTicks]
  );

  const pauseVideo = useCallback(
    (triggerRef: boolean = true) => {
      if (triggerRef === true) {
        videoRef.current?.pause();
      }
      _setIsPlaying(false);
      reportPlaybackProgress({
        api,
        itemId: currentlyPlaying?.item.Id,
        positionTicks: progressTicks ? progressTicks : 0,
        sessionId: session?.PlaySessionId,
        IsPaused: true,
      });
    },
    [session?.PlaySessionId, currentlyPlaying?.item.Id, progressTicks]
  );

  const stopPlayback = useCallback(async () => {
    await reportPlaybackStopped({
      api,
      itemId: currentlyPlaying?.item?.Id,
      sessionId: session?.PlaySessionId,
      positionTicks: progressTicks ? progressTicks : 0,
    });
    setCurrentlyPlayingState(null);
  }, [currentlyPlaying?.item.Id, session?.PlaySessionId, progressTicks, api]);

  const setIsPlaying = useCallback(
    debounce((value: boolean) => {
      _setIsPlaying(value);
    }, 500),
    []
  );

  const _onProgress = useCallback(
    ({ currentTime }: OnProgressData) => {
      if (
        !session?.PlaySessionId ||
        !currentlyPlaying?.item.Id ||
        currentTime === 0
      )
        return;
      const ticks = currentTime * 10000000;
      setProgressTicks(ticks);
      reportPlaybackProgress({
        api,
        itemId: currentlyPlaying?.item.Id,
        positionTicks: ticks,
        sessionId: session?.PlaySessionId,
        IsPaused: !isPlaying,
      });
    },
    [session?.PlaySessionId, currentlyPlaying?.item.Id, isPlaying, api]
  );

  const onProgress = useCallback(
    debounce((e: OnProgressData) => {
      _onProgress(e);
    }, 1000),
    [_onProgress]
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

    const protocol = api?.basePath.includes("https") ? "wss" : "ws";

    const url = `${protocol}://${api?.basePath
      .replace("https://", "")
      .replace("http://", "")}/socket?api_key=${
      api?.accessToken
    }&deviceId=${deviceId}`;

    const newWebSocket = new WebSocket(url);

    let keepAliveInterval: NodeJS.Timeout | null = null;

    newWebSocket.onopen = () => {
      setIsConnected(true);
      // Start sending "KeepAlive" message every 30 seconds
      keepAliveInterval = setInterval(() => {
        if (newWebSocket.readyState === WebSocket.OPEN) {
          newWebSocket.send(JSON.stringify({ MessageType: "KeepAlive" }));
        }
      }, 30000);
    };

    newWebSocket.onerror = (e) => {
      console.error("WebSocket error:", e);
      setIsConnected(false);
    };

    newWebSocket.onclose = (e) => {
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

      console.log("[WS] ~ ", json);

      // On PlayPause
      if (command === "PlayPause") {
        console.log("Command ~ PlayPause");
        if (isPlaying) pauseVideo();
        else playVideo();
      } else if (command === "Stop") {
        console.log("Command ~ Stop");
        stopPlayback();
      } else if (command === "Mute") {
        console.log("Command ~ Mute");
        setVolume(0);
      } else if (command === "Unmute") {
        console.log("Command ~ Unmute");
        setVolume(previousVolume.current || 20);
      } else if (command === "SetVolume") {
        console.log("Command ~ SetVolume");
      } else if (json?.Data?.Name === "DisplayMessage") {
        console.log("Command ~ DisplayMessage");
        const title = json?.Data?.Arguments?.Header;
        const body = json?.Data?.Arguments?.Text;
        Alert.alert(title, body);
      }
    };
  }, [ws, stopPlayback, playVideo, pauseVideo]);

  return (
    <PlaybackContext.Provider
      value={{
        onProgress,
        progressTicks,
        setVolume,
        setIsPlaying,
        setIsFullscreen,
        isFullscreen,
        isPlaying,
        currentlyPlaying,
        sessionData: session,
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
