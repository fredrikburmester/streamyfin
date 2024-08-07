import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
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
import { TouchableOpacity, View } from "react-native";
import { useCastDevice, useRemoteMediaClient } from "react-native-google-cast";
import Video, { OnProgressData, VideoRef } from "react-native-video";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Button } from "./Button";
import { Text } from "./common/Text";
import ios12 from "../utils/profiles/ios12";
import { reportPlaybackProgress } from "@/utils/jellyfin/playstate/reportPlaybackProgress";
import { chromecastProfile } from "@/utils/profiles/chromecast";
import { reportPlaybackStopped } from "@/utils/jellyfin/playstate/reportPlaybackStopped";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";

type VideoPlayerProps = {
  itemId: string;
  onChangePlaybackURL: (url: string | null) => void;
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

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  itemId,
  onChangePlaybackURL,
}) => {
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
        deviceProfile: castDevice?.deviceId ? chromecastProfile : ios12,
      });

      console.log("Transcode URL:", url);

      onChangePlaybackURL(url);

      return url;
    },
    enabled: !!sessionData,
    staleTime: 0,
  });

  const onProgress = useCallback(
    ({ currentTime }: OnProgressData) => {
      if (!currentTime || !sessionData?.PlaySessionId || paused) return;
      const newProgress = currentTime * 10000000;
      setProgress(newProgress);
      reportPlaybackProgress({
        api,
        itemId,
        positionTicks: newProgress,
        sessionId: sessionData.PlaySessionId,
      });
    },
    [sessionData?.PlaySessionId, item, api, paused],
  );

  const play = () => {
    if (videoRef.current) {
      videoRef.current.resume();
      setPaused(false);
    }
  };

  const pause = useCallback(() => {
    videoRef.current?.pause();
    setPaused(true);

    if (progress > 0)
      reportPlaybackStopped({
        api,
        itemId: item?.Id,
        positionTicks: progress,
        sessionId: sessionData?.PlaySessionId,
      });

    queryClient.invalidateQueries({
      queryKey: ["nextUp", item?.SeriesId],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["episodes"],
      refetchType: "all",
    });
  }, [api, item, progress, sessionData, queryClient]);

  const startPosition = useMemo(
    () =>
      item?.UserData?.PlaybackPositionTicks
        ? Math.round(item.UserData.PlaybackPositionTicks / 10000)
        : 0,
    [item],
  );

  const enableVideo = useMemo(
    () => !!(playbackURL && item && startPosition !== null && sessionData),
    [playbackURL, item, startPosition, sessionData],
  );

  const chromecastReady = useMemo(
    () => !!(castDevice?.deviceId && item),
    [castDevice, item],
  );

  const cast = useCallback(() => {
    if (!client || !playbackURL || !item) return;
    client.loadMedia({
      mediaInfo: {
        contentUrl: playbackURL,
        contentType: "video/mp4",
        metadata: {
          type: item.Type === "Episode" ? "tvShow" : "movie",
          title: item.Name || "",
          subtitle: item.Overview || "",
        },
        streamDuration: Math.floor((item.RunTimeTicks || 0) / 10000),
      },
      startTime: Math.floor(
        (item.UserData?.PlaybackPositionTicks || 0) / 10000,
      ),
    });
  }, [item, client, playbackURL]);

  useEffect(() => {
    videoRef.current?.pause();
  }, []);

  return (
    <View>
      {enableVideo === true && startPosition !== null && !!playbackURL ? (
        <Video
          style={{ width: 0, height: 0 }}
          source={{
            uri: playbackURL,
            isNetwork: true,
            startPosition,
          }}
          ref={videoRef}
          onBuffer={(e) => (e.isBuffering ? console.log("Buffering...") : null)}
          onProgress={(e) => onProgress(e)}
          onFullscreenPlayerDidDismiss={() => {
            pause();
          }}
          onFullscreenPlayerDidPresent={() => {
            play();
          }}
          paused={paused}
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
            } else {
              setTimeout(() => {
                if (!videoRef.current) return;
                videoRef.current.presentFullscreenPlayer();
              }, 1000);
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
