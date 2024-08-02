import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import Video, {
  OnPlaybackStateChangedData,
  OnProgressData,
  VideoRef,
} from "react-native-video";
import { apiAtom, useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import {
  getBackdrop,
  getStreamUrl,
  getUserItemData,
  reportPlaybackProgress,
  reportPlaybackStopped,
} from "@/utils/jellyfin";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";
import { runtimeTicksToMinutes } from "@/utils/time";
import { Text } from "./common/Text";

type VideoPlayerProps = {
  itemId: string;
};

const BITRATES = [
  {
    key: "Max",
    value: 140000000,
  },
  {
    key: "10 Mb/s",
    value: 10000000,
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
    key: "1 Mb/s",
    value: 1000000,
  },
  {
    key: "500 Kb/s",
    value: 500000,
  },
];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ itemId }) => {
  const videoRef = useRef<VideoRef | null>(null);
  const [showPoster, setShowPoster] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [maxBitrate, setMaxbitrate] = useState(140000000);
  const [paused, setPaused] = useState(true);
  const [forceTranscoding, setForceTranscoding] = useState<boolean>(false);

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const {} = useJellyfin();

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
    staleTime: Infinity,
  });

  const { data: item } = useQuery({
    queryKey: ["item", itemId],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId,
      }),
    enabled: !!itemId && !!api,
    staleTime: Infinity,
  });

  const { data: playbackURL } = useQuery({
    queryKey: ["playbackUrl", itemId, maxBitrate, forceTranscoding],
    queryFn: async () => {
      if (!api || !user?.Id) return null;

      const url = await getStreamUrl({
        api,
        userId: user.Id,
        item,
        startTimeTicks: item?.UserData?.PlaybackPositionTicks || 0,
        maxStreamingBitrate: maxBitrate,
        forceTranscoding: forceTranscoding,
      });

      console.log("Transcode URL:", url);

      return url;
    },
    enabled: !!itemId && !!api && !!user?.Id && !!item,
    staleTime: 0,
  });

  const [progress, setProgress] = useState(0);

  const onProgress = ({
    currentTime,
    playableDuration,
    seekableDuration,
  }: OnProgressData) => {
    setProgress(currentTime * 10000000);
    reportPlaybackProgress({
      api,
      itemId: itemId,
      positionTicks: currentTime * 10000000,
      sessionId: sessionData?.PlaySessionId,
    });
  };

  const onSeek = ({
    currentTime,
    seekTime,
  }: {
    currentTime: number;
    seekTime: number;
  }) => {
    // console.log("Seek to time: ", seekTime);
  };

  const onError = (error: any) => {
    // console.log("Video Error: ", error);
  };

  const play = () => {
    if (videoRef.current) {
      videoRef.current.resume();
    }
  };

  const startPosition = useMemo(() => {
    return Math.round((item?.UserData?.PlaybackPositionTicks || 0) / 10000);
  }, [item]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const enableVideo = useMemo(() => {
    return (
      playbackURL !== undefined &&
      item !== undefined &&
      item !== null &&
      startPosition !== undefined &&
      sessionData !== undefined
    );
  }, [playbackURL, item, startPosition, sessionData]);

  return (
    <View>
      {enableVideo && (
        <Video
          style={{ width: 0, height: 0 }}
          source={{
            uri: playbackURL!,
            isNetwork: true,
            startPosition,
          }}
          ref={videoRef}
          onSeek={(t) => onSeek(t)}
          onError={onError}
          onProgress={(e) => onProgress(e)}
          onFullscreenPlayerDidDismiss={() => {
            videoRef.current?.pause();
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
        />
      )}
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-col mb-2">
          <Text className="opacity-50 text-xs mb-1">Force transcoding</Text>
          <Switch
            value={forceTranscoding}
            onValueChange={setForceTranscoding}
          />
        </View>
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
            {BITRATES?.map((b: any) => (
              <DropdownMenu.Item
                key={b.value}
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
            if (videoRef.current) {
              videoRef.current.presentFullscreenPlayer();
            }
          }}
          iconRight={<Ionicons name="play-circle" size={24} color="white" />}
        >
          {runtimeTicksToMinutes(item?.RunTimeTicks)}
        </Button>
      </View>
    </View>
  );
};
