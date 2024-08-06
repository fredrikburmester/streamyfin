import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  getStreamUrl,
  getUserItemData,
  reportPlaybackProgress,
  reportPlaybackStopped,
} from "@/utils/jellyfin";
import { runtimeTicksToMinutes } from "@/utils/time";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import Video, {
  OnBufferData,
  OnPlaybackStateChangedData,
  OnProgressData,
  OnVideoErrorData,
  VideoRef,
} from "react-native-video";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Button } from "./Button";
import { Text } from "./common/Text";
import { useCastDevice, useRemoteMediaClient } from "react-native-google-cast";
import GoogleCast from "react-native-google-cast";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { chromecastProfile, iosProfile } from "@/utils/device-profiles";

type VideoPlayerProps = {
  itemId: string;
};

const BITRATES = [
  {
    key: "Max",
    value: undefined,
  },
  {
    key: "4 Mb/s",
    value: 4000000,
  },
  {
    key: "2 Mb/s",
    value: 2000000,
  },
  {
    key: "500 Kb/s",
    value: 500000,
  },
];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ itemId }) => {
  const videoRef = useRef<VideoRef | null>(null);
  const [maxBitrate, setMaxbitrate] = useState<number | undefined>(undefined);
  const [paused, setPaused] = useState(true);
  const [progress, setProgress] = useState(0);

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const castDevice = useCastDevice();
  const client = useRemoteMediaClient();

  const queryClient = useQueryClient();

  const { data: item } = useQuery({
    queryKey: ["item", itemId],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId,
      }),
    enabled: !!itemId && !!api,
    staleTime: 60,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["sessionData", itemId],
    queryFn: async () => {
      const playbackData = await getMediaInfoApi(api!).getPlaybackInfo({
        itemId,
        userId: user?.Id,
      });

      return playbackData.data;
    },
    enabled: !!itemId && !!api && !!user?.Id,
    staleTime: 0,
  });

  const { data: playbackURL } = useQuery({
    queryKey: ["playbackUrl", itemId, maxBitrate, castDevice],
    queryFn: async () => {
      if (!api || !user?.Id || !sessionData) return null;

      const url = await getStreamUrl({
        api,
        userId: user.Id,
        item,
        startTimeTicks: item?.UserData?.PlaybackPositionTicks || 0,
        maxStreamingBitrate: maxBitrate,
        sessionData,
        deviceProfile: castDevice?.deviceId ? chromecastProfile : iosProfile,
      });

      console.log("Transcode URL:", url);

      return url;
    },
    enabled: !!sessionData,
    staleTime: 0,
  });

  const onProgress = useCallback(
    ({ currentTime, playableDuration, seekableDuration }: OnProgressData) => {
      if (!currentTime || !sessionData?.PlaySessionId) return;
      if (paused) return;

      const newProgress = currentTime * 10000000;
      setProgress(newProgress);
      reportPlaybackProgress({
        api,
        itemId: itemId,
        positionTicks: newProgress,
        sessionId: sessionData.PlaySessionId,
      });
    },
    [sessionData?.PlaySessionId, item, api, paused]
  );

  const onSeek = ({
    currentTime,
    seekTime,
  }: {
    currentTime: number;
    seekTime: number;
  }) => {
    // console.log("Seek to time: ", seekTime);
  };

  const onError = (error: OnVideoErrorData) => {
    console.log("Video Error: ", JSON.stringify(error.error));
  };

  const onBuffer = (error: OnBufferData) => {
    console.log("Video buffering: ", error.isBuffering);
  };

  const play = () => {
    if (videoRef.current) {
      videoRef.current.resume();
      setPaused(false);
    }
  };

  const startPosition = useMemo(() => {
    return Math.round((item?.UserData?.PlaybackPositionTicks || 0) / 10000);
  }, [item]);

  const enableVideo = useMemo(() => {
    return (
      playbackURL !== undefined &&
      item !== undefined &&
      item !== null &&
      startPosition !== undefined &&
      sessionData !== undefined
    );
  }, [playbackURL, item, startPosition, sessionData]);

  const cast = useCallback(() => {
    if (client === null) {
      console.log("no client ");
      return;
    }

    if (!playbackURL) {
      console.log("no playback url");
      return;
    }

    if (!item) {
      console.log("no item");
      return;
    }

    client.loadMedia({
      mediaInfo: {
        contentUrl: playbackURL,
        contentType: "video/mp4",
        metadata: {
          type: item?.Type === "Episode" ? "tvShow" : "movie",
          title: item?.Name || "",
          subtitle: item?.Overview || "",
        },
        streamDuration: Math.floor((item?.RunTimeTicks || 0) / 10000),
      },
      startTime: Math.floor(
        (item?.UserData?.PlaybackPositionTicks || 0) / 10000
      ),
    });
  }, [item, client, playbackURL]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const chromecastReady = useMemo(() => {
    return castDevice?.deviceId && item;
  }, [castDevice, item]);

  return (
    <View>
      {enableVideo === true &&
      playbackURL !== null &&
      playbackURL !== undefined ? (
        <Video
          style={{ width: 0, height: 0 }}
          source={{
            uri: playbackURL,
            isNetwork: true,
            startPosition,
          }}
          debug={{
            enable: true,
            thread: true,
          }}
          ref={videoRef}
          onBuffer={onBuffer}
          onSeek={(t) => onSeek(t)}
          onError={onError}
          onProgress={(e) => onProgress(e)}
          onFullscreenPlayerDidDismiss={() => {
            videoRef.current?.pause();
            setPaused(true);

            queryClient.invalidateQueries({
              queryKey: ["nextUp", item?.SeriesId],
              refetchType: "all",
            });
            queryClient.invalidateQueries({
              queryKey: ["episodes"],
              refetchType: "all",
            });

            if (progress === 0) return;

            reportPlaybackStopped({
              api,
              itemId: item?.Id,
              positionTicks: progress,
              sessionId: sessionData?.PlaySessionId,
            });
          }}
          onFullscreenPlayerDidPresent={() => {
            play();
          }}
          paused={paused}
          onPlaybackStateChanged={(e: OnPlaybackStateChangedData) => {}}
          bufferConfig={{
            maxBufferMs: Infinity,
            minBufferMs: 1000 * 60 * 2,
            bufferForPlaybackMs: 1000,
            backBufferDurationMs: 30 * 1000,
          }}
          ignoreSilentSwitch="ignore"
        />
      ) : null}
      <View className="flex flex-row items-center justify-between">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <View className="flex flex-col mb-2">
              <Text className="opacity-50 mb-1 text-xs">Bitrate</Text>
              <View className="flex flex-row">
                <TouchableOpacity className="bg-neutral-900 rounded-2xl border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                  <Text>
                    {BITRATES.find((b) => b.value === maxBitrate)?.key}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            loop={true}
            side="bottom"
            align="start"
            alignOffset={0}
            avoidCollisions={true}
            collisionPadding={8}
            sideOffset={8}
          >
            <DropdownMenu.Label>Bitrates</DropdownMenu.Label>
            {BITRATES?.map((b: any, index: number) => (
              <DropdownMenu.Item
                key={index.toString()}
                onSelect={() => {
                  setMaxbitrate(b.value);
                }}
              >
                <DropdownMenu.ItemTitle>{b.key}</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </View>

      <View className="flex flex-col w-full">
        <Button
          disabled={!enableVideo}
          onPress={() => {
            if (chromecastReady) {
              cast();
            } else if (videoRef.current) {
              videoRef.current.presentFullscreenPlayer();
            }
          }}
          iconRight={
            chromecastReady ? (
              <Feather name="cast" size={20} color="white" />
            ) : (
              <Ionicons name="play-circle" size={24} color="white" />
            )
          }
        >
          {runtimeTicksToMinutes(item?.RunTimeTicks)}
        </Button>
      </View>
    </View>
  );
};
