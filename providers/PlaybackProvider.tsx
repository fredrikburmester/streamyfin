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
import { getMediaInfoApi, getSyncPlayApi } from "@jellyfin/sdk/lib/utils/api";
import * as Linking from "expo-linking";
import { useAtom } from "jotai";
import { debounce, isBuffer } from "lodash";
import { Alert } from "react-native";
import { OnProgressData, type VideoRef } from "react-native-video";
import { apiAtom, userAtom } from "./JellyfinProvider";
import {
  GroupData,
  GroupJoinedData,
  PlayQueueData,
  StateUpdateData,
} from "@/types/syncplay";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";

type CurrentlyPlayingState = {
  url: string;
  item: BaseItemDto;
};

interface PlaybackContextType {
  sessionData: PlaybackInfoResponse | null | undefined;
  currentlyPlaying: CurrentlyPlayingState | null;
  videoRef: React.MutableRefObject<VideoRef | null>;
  onBuffer: (isBuffering: boolean) => void;
  onReady: () => void;
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
  startDownloadedFilePlayback: (
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
  const [syncplayGroup, setSyncplayGroup] = useState<GroupData | null>(null);
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

  const startDownloadedFilePlayback = useCallback(
    async (state: CurrentlyPlayingState | null) => {
      if (!state) {
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        return;
      }

      setCurrentlyPlaying(state);
      setIsPlaying(true);
      if (settings?.openFullScreenVideoPlayerByDefault) {
        setTimeout(() => {
          presentFullscreenPlayer();
        }, 300);
      }
    },
    [settings?.openFullScreenVideoPlayerByDefault]
  );

  const setCurrentlyPlayingState = useCallback(
    async (state: CurrentlyPlayingState | null, paused = false) => {
      try {
        if (state?.item.Id && user?.Id) {
          const vlcLink = "vlc://" + state?.url;
          if (vlcLink && settings?.openInVLC) {
            Linking.openURL("vlc://" + state?.url || "");
            return;
          }

          const res = await getMediaInfoApi(api!).getPlaybackInfo({
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

          if (paused === true) {
            pauseVideo();
          } else {
            playVideo();
          }

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
      } catch (e) {
        console.error(e);
        Alert.alert(
          "Something went wrong",
          "The item could not be played. Maybe there is no internet connection?",
          [
            {
              style: "destructive",
              text: "Try force play",
              onPress: () => {
                setCurrentlyPlaying(state);
                setIsPlaying(true);
                if (settings?.openFullScreenVideoPlayerByDefault) {
                  setTimeout(() => {
                    presentFullscreenPlayer();
                  }, 300);
                }
              },
            },
            {
              text: "Ok",
              style: "default",
            },
          ]
        );
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

  const onBuffer = useCallback(
    (isBuffering: boolean) => {
      console.log("Buffering...", "Playing:", isPlaying);
      if (
        isBuffering &&
        syncplayGroup?.GroupId &&
        isPlaying === false &&
        currentlyPlaying?.item.PlaylistItemId
      ) {
        console.log("Sending syncplay buffering...");
        getSyncPlayApi(api!).syncPlayBuffering({
          bufferRequestDto: {
            IsPlaying: isPlaying,
            When: new Date().toISOString(),
            PositionTicks: progressTicks ? progressTicks : 0,
            PlaylistItemId: currentlyPlaying?.item.PlaylistItemId,
          },
        });
      }
    },
    [
      isPlaying,
      syncplayGroup?.GroupId,
      currentlyPlaying?.item.PlaylistItemId,
      api,
    ]
  );

  const onReady = useCallback(() => {
    if (syncplayGroup?.GroupId && currentlyPlaying?.item.PlaylistItemId) {
      getSyncPlayApi(api!).syncPlayReady({
        readyRequestDto: {
          When: new Date().toISOString(),
          PlaylistItemId: currentlyPlaying?.item.PlaylistItemId,
          IsPlaying: isPlaying,
          PositionTicks: progressTicks ? progressTicks : 0,
        },
      });
    }
  }, [
    syncplayGroup?.GroupId,
    currentlyPlaying?.item.PlaylistItemId,
    progressTicks,
    isPlaying,
    api,
  ]);

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

  const seek = useCallback((ticks: number) => {
    const time = ticks / 10000000;
    videoRef.current?.seek(time);
  }, []);

  useEffect(() => {
    if (!deviceId || !api?.accessToken || !user?.Id) {
      console.info("[WS] Waiting for deviceId, accessToken and userId");
      return;
    }

    const protocol = api?.basePath.includes("https") ? "wss" : "ws";
    const url = `${protocol}://${api?.basePath
      .replace("https://", "")
      .replace("http://", "")}/socket?api_key=${
      api?.accessToken
    }&deviceId=${deviceId}`;

    let ws: WebSocket | null = null;
    let keepAliveInterval: NodeJS.Timeout | null = null;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        keepAliveInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log("⬆︎ KeepAlive...");
            ws.send(JSON.stringify({ MessageType: "KeepAlive" }));
          }
        }, 30000);
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
        setTimeout(connect, 5000); // Attempt to reconnect after 5 seconds
      };

      setWs(ws);
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };
  }, [api?.accessToken, deviceId, user]);

  useEffect(() => {
    if (!ws || !api) return;

    ws.onmessage = (e) => {
      const json = JSON.parse(e.data);
      const command = json?.Data?.Command;

      if (json.MessageType === "KeepAlive") {
        console.log("⬇︎ KeepAlive...");
      } else if (json.MessageType === "ForceKeepAlive") {
        console.log("⬇︎ ForceKeepAlive...");
      } else if (json.MessageType === "SyncPlayCommand") {
        console.log("SyncPlayCommand ~", command, json.Data);
        switch (command) {
          case "Stop":
            console.log("STOP");
            stopPlayback();
            break;
          case "Pause":
            console.log("PAUSE");
            pauseVideo();
            break;
          case "Play":
          case "Unpause":
            console.log("PLAY");
            playVideo();
            break;
          case "Seek":
            console.log("SEEK", json.Data.PositionTicks);
            seek(json.Data.PositionTicks);
            break;
        }
      } else if (json.MessageType === "SyncPlayGroupUpdate") {
        const type = json.Data.Type;

        if (type === "StateUpdate") {
          const data = json.Data.Data as StateUpdateData;
          console.log("StateUpdate ~", data);
        } else if (type === "GroupJoined") {
          const data = json.Data.Data as GroupData;
          setSyncplayGroup(data);
          console.log("GroupJoined ~", data);
        } else if (type === "GroupLeft") {
          console.log("GroupLeft");
          setSyncplayGroup(null);
        } else if (type === "PlayQueue") {
          const data = json.Data.Data as PlayQueueData;
          console.log("PlayQueue ~", {
            IsPlaying: data.IsPlaying,
            Reason: data.Reason,
          });

          if (data.Reason === "SetCurrentItem") {
            console.log("SetCurrentItem ~ ", json);
            return;
          }

          if (data.Reason === "NewPlaylist") {
            const itemId = data.Playlist?.[data.PlayingItemIndex].ItemId;
            if (!itemId) {
              console.error("No itemId found in PlayQueue");
              return;
            }

            // Set playback item
            getUserItemData({
              api,
              userId: user?.Id,
              itemId,
            }).then(async (item) => {
              if (!item) {
                Alert.alert("Error", "Could not find item for syncplay");
                return;
              }

              const url = await getStreamUrl({
                api,
                item,
                startTimeTicks: data.StartPositionTicks,
                userId: user?.Id,
                mediaSourceId: item?.MediaSources?.[0].Id!,
              });

              if (!url) {
                Alert.alert("Error", "Could not find stream url for syncplay");
                return;
              }

              await setCurrentlyPlayingState(
                {
                  item,
                  url,
                },
                !data.IsPlaying
              );

              await getSyncPlayApi(api).syncPlayReady({
                readyRequestDto: {
                  IsPlaying: data.IsPlaying,
                  PositionTicks: data.StartPositionTicks,
                  PlaylistItemId: data.Playlist[0].PlaylistItemId,
                  When: new Date().toISOString(),
                },
              });
            });
          }
        } else {
          console.log("[WS] ~ ", json);
        }

        return;
      } else {
        console.log("[WS] ~ ", json);
      }

      if (command === "PlayPause") {
        // On PlayPause
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
  }, [ws, stopPlayback, playVideo, pauseVideo, setVolume, api, seek]);

  return (
    <PlaybackContext.Provider
      value={{
        onProgress,
        onReady,
        progressTicks,
        setVolume,
        setIsPlaying,
        setIsFullscreen,
        onBuffer,
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
        startDownloadedFilePlayback,
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
