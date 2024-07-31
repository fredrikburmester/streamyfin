import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

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
} from "@/utils/jellyfin";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";
import { runtimeTicksToMinutes } from "@/utils/time";

type VideoPlayerProps = {
  itemId: string;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ itemId }) => {
  const videoRef = useRef<VideoRef | null>(null);
  const [showPoster, setShowPoster] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);

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

  useEffect(() => {
    console.log(item?.UserData?.PlaybackPositionTicks);
    console.log(item?.UserData?.PlayedPercentage);
  }, [item]);

  const { data: playbackURL } = useQuery({
    queryKey: ["playbackUrl", itemId],
    queryFn: async () => {
      if (!api || !user?.Id) return;
      return (
        (await getStreamUrl({
          api,
          userId: user.Id,
          item,
          startTimeTicks: item?.UserData?.PlaybackPositionTicks || 0,
        })) || undefined
      );
    },
    enabled: !!itemId && !!api && !!user?.Id && !!item,
    staleTime: Infinity,
  });

  const { data: posterUrl } = useQuery({
    queryKey: ["backdrop", item?.Id],
    queryFn: async () => getBackdrop(api, item),
    enabled: !!api && !!item?.Id,
    staleTime: Infinity,
  });

  const onProgress = ({
    currentTime,
    playableDuration,
    seekableDuration,
  }: OnProgressData) => {
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
    console.log("Seek to time: ", seekTime);
  };

  const onError = (error: any) => {
    console.log("Video Error: ", error);
  };

  const play = () => {
    if (videoRef.current) {
      videoRef.current.resume();
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  if (!playbackURL) return null;

  return (
    <View>
      <Video
        style={{ width: 0, height: 0 }}
        source={{
          uri: playbackURL,
          isNetwork: true,
          startPosition: Math.round(
            (item?.UserData?.PlaybackPositionTicks || 0) / 10000
          ),
        }}
        ref={videoRef}
        onSeek={(t) => onSeek(t)}
        onError={onError}
        onProgress={(e) => onProgress(e)}
        onFullscreenPlayerDidDismiss={() => {
          videoRef.current?.pause();
        }}
        onFullscreenPlayerDidPresent={() => {
          play();
        }}
        onPlaybackStateChanged={(e: OnPlaybackStateChangedData) => {}}
        bufferConfig={{
          maxBufferMs: Infinity,
          minBufferMs: 1000 * 60 * 2,
          bufferForPlaybackMs: 1000,
          backBufferDurationMs: 30 * 1000,
        }}
      />
      <View className="flex flex-col w-full">
        <Button
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
