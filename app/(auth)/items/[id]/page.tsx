import { Chromecast } from "@/components/Chromecast";
import { Text } from "@/components/common/Text";
import { DownloadItem } from "@/components/DownloadItem";
import { PlayedStatus } from "@/components/PlayedStatus";
import { CastAndCrew } from "@/components/series/CastAndCrew";
import { CurrentSeries } from "@/components/series/CurrentSeries";
import { SimilarItems } from "@/components/SimilarItems";
import { VideoPlayer } from "@/components/VideoPlayer";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { ParallaxScrollView } from "../../../../components/ParallaxPage";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getLogoImageUrlById } from "@/utils/jellyfin/image/getLogoImageUrlById";
import { PlayButton } from "@/components/PlayButton";
import { Bitrate, BitrateSelector } from "@/components/BitrateSelector";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import CastContext, {
  PlayServicesState,
  useCastDevice,
  useRemoteMediaClient,
} from "react-native-google-cast";
import { chromecastProfile } from "@/utils/profiles/chromecast";
import ios12 from "@/utils/profiles/ios12";
import { currentlyPlayingItemAtom } from "@/components/CurrentlyPlayingBar";
import { AudioTrackSelector } from "@/components/AudioTrackSelector";
import { SubtitleTrackSelector } from "@/components/SubtitleTrackSelector";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Button } from "@/components/Button";
import { Ionicons } from "@expo/vector-icons";
import { NextEpisodeButton } from "@/components/series/NextEpisodeButton";

const page: React.FC = () => {
  const local = useLocalSearchParams();
  const { id } = local as { id: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const castDevice = useCastDevice();

  const chromecastReady = useMemo(() => !!castDevice?.deviceId, [castDevice]);
  const [selectedAudioStream, setSelectedAudioStream] = useState<number>(-1);
  const [selectedSubtitleStream, setSelectedSubtitleStream] =
    useState<number>(0);
  const [maxBitrate, setMaxBitrate] = useState<Bitrate>({
    key: "Max",
    value: undefined,
  });

  const { data: item, isLoading: l1 } = useQuery({
    queryKey: ["item", id],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId: id,
      }),
    enabled: !!id && !!api,
    staleTime: 60,
  });

  const backdropUrl = useMemo(
    () =>
      getBackdropUrl({
        api,
        item,
        quality: 90,
        width: 1000,
      }),
    [item],
  );

  const logoUrl = useMemo(
    () => (item?.Type === "Movie" ? getLogoImageUrlById({ api, item }) : null),
    [item],
  );

  const { data: sessionData } = useQuery({
    queryKey: ["sessionData", item?.Id],
    queryFn: async () => {
      if (!api || !user?.Id || !item?.Id) return null;
      const playbackData = await getMediaInfoApi(api!).getPlaybackInfo({
        itemId: item?.Id,
        userId: user?.Id,
      });

      return playbackData.data;
    },
    enabled: !!item?.Id && !!api && !!user?.Id,
    staleTime: 0,
  });

  const { data: playbackUrl } = useQuery({
    queryKey: [
      "playbackUrl",
      item?.Id,
      maxBitrate,
      castDevice,
      selectedAudioStream,
    ],
    queryFn: async () => {
      if (!api || !user?.Id || !sessionData) return null;

      const url = await getStreamUrl({
        api,
        userId: user.Id,
        item,
        startTimeTicks: item?.UserData?.PlaybackPositionTicks || 0,
        maxStreamingBitrate: maxBitrate.value,
        sessionData,
        deviceProfile: castDevice?.deviceId ? chromecastProfile : ios12,
        audioStreamIndex: selectedAudioStream,
        subtitleStreamIndex: selectedSubtitleStream,
      });

      console.log("Transcode URL: ", url);

      return url;
    },
    enabled: !!sessionData,
    staleTime: 0,
  });

  const [cp, setCp] = useAtom(currentlyPlayingItemAtom);
  const client = useRemoteMediaClient();

  const onPressPlay = useCallback(async () => {
    if (!playbackUrl || !item) return;

    if (chromecastReady && client) {
      await CastContext.getPlayServicesState().then((state) => {
        if (state && state !== PlayServicesState.SUCCESS)
          CastContext.showPlayServicesErrorDialog(state);
        else {
          client.loadMedia({
            mediaInfo: {
              contentUrl: playbackUrl,
              contentType: "video/mp4",
              metadata: {
                type: item.Type === "Episode" ? "tvShow" : "movie",
                title: item.Name || "",
                subtitle: item.Overview || "",
              },
            },
            startTime: 0,
          });
        }
      });
    } else {
      setCp({
        item,
        playbackUrl,
      });
    }
  }, [playbackUrl, item]);

  if (l1)
    return (
      <View className="justify-center items-center h-full">
        <ActivityIndicator />
      </View>
    );

  if (!item?.Id || !backdropUrl) return null;

  return (
    <ParallaxScrollView
      headerImage={
        <Image
          source={{
            uri: backdropUrl,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      }
      logo={
        <>
          {logoUrl ? (
            <Image
              source={{
                uri: logoUrl,
              }}
              style={{
                height: 130,
                width: "100%",
                resizeMode: "contain",
              }}
            />
          ) : null}
        </>
      }
    >
      <View className="flex flex-col px-4 pt-4">
        <View className="flex flex-col">
          {item.Type === "Episode" ? (
            <>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(auth)/series/${item.SeriesId}/page`)
                }
              >
                <Text className="text-center opacity-50">
                  {item?.SeriesName}
                </Text>
              </TouchableOpacity>
              <View className="flex flex-row items-center self-center px-4">
                <Text className="text-center font-bold text-2xl mr-2">
                  {item?.Name}
                </Text>
              </View>
              <View>
                <View className="flex flex-row items-center self-center">
                  <TouchableOpacity onPress={() => {}}>
                    <Text className="text-center opacity-50">
                      {item?.SeasonName}
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-center opacity-50 mx-2">{"—"}</Text>
                  <Text className="text-center opacity-50">
                    {`Episode ${item.IndexNumber}`}
                  </Text>
                </View>
              </View>
              <Text className="text-center opacity-50">
                {item.ProductionYear}
              </Text>
            </>
          ) : (
            <>
              <View className="flex flex-row items-center self-center px-4">
                <Text className="text-center font-bold text-2xl mr-2">
                  {item?.Name}
                </Text>
              </View>
              <Text className="text-center opacity-50">
                {item?.ProductionYear}
              </Text>
            </>
          )}
        </View>

        <View className="flex flex-row justify-between items-center w-full my-4">
          {playbackUrl ? (
            <DownloadItem item={item} playbackUrl={playbackUrl} />
          ) : (
            <View className="h-12 aspect-square flex items-center justify-center"></View>
          )}
          <PlayedStatus item={item} />
          <Chromecast />
        </View>
        <Text>{item.Overview}</Text>
      </View>
      <View className="flex flex-col p-4 w-full">
        <View className="flex flex-row items-center space-x-2 w-full">
          <BitrateSelector
            onChange={(val) => setMaxBitrate(val)}
            selected={maxBitrate}
          />
          <AudioTrackSelector
            item={item}
            onChange={setSelectedAudioStream}
            selected={selectedAudioStream}
          />
          <SubtitleTrackSelector
            item={item}
            onChange={setSelectedSubtitleStream}
            selected={selectedSubtitleStream}
          />
        </View>
        <View className="flex flex-row items-center justify-between space-x-2 w-full">
          <NextEpisodeButton item={item} type="previous" />
          <PlayButton
            item={item}
            chromecastReady={false}
            onPress={onPressPlay}
            className="grow"
          />
          <NextEpisodeButton item={item} />
        </View>
      </View>
      <ScrollView horizontal className="flex px-4 mb-4">
        <View className="flex flex-row space-x-2 ">
          <View className="flex flex-col">
            <Text className="text-sm opacity-70">Video</Text>
            <Text className="text-sm opacity-70">Audio</Text>
            <Text className="text-sm opacity-70">Subtitles</Text>
          </View>
          <View className="flex flex-col">
            <Text className="text-sm opacity-70">
              {item.MediaStreams?.find((i) => i.Type === "Video")?.DisplayTitle}
            </Text>
            <Text className="text-sm opacity-70">
              {item.MediaStreams?.find((i) => i.Type === "Audio")?.DisplayTitle}
            </Text>
            <Text className="text-sm opacity-70">
              {
                item.MediaStreams?.find((i) => i.Type === "Subtitle")
                  ?.DisplayTitle
              }
            </Text>
          </View>
        </View>
      </ScrollView>

      <CastAndCrew item={item} />

      {item.Type === "Episode" && (
        <View className="mb-4">
          <CurrentSeries item={item} />
        </View>
      )}

      <SimilarItems itemId={item.Id} />

      <View className="h-12"></View>
    </ParallaxScrollView>
  );
};

export default page;
