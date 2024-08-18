import { AudioTrackSelector } from "@/components/AudioTrackSelector";
import { Bitrate, BitrateSelector } from "@/components/BitrateSelector";
import { Text } from "@/components/common/Text";
import {
  currentlyPlayingItemAtom,
  playingAtom,
} from "@/components/CurrentlyPlayingBar";
import { Loader } from "@/components/Loader";
import { MoviesTitleHeader } from "@/components/movies/MoviesTitleHeader";
import { ParallaxScrollView } from "@/components/ParallaxPage";
import { PlayButton } from "@/components/PlayButton";
import { NextEpisodeButton } from "@/components/series/NextEpisodeButton";
import { SimilarItems } from "@/components/SimilarItems";
import { SubtitleTrackSelector } from "@/components/SubtitleTrackSelector";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getLogoImageUrlById } from "@/utils/jellyfin/image/getLogoImageUrlById";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import ios from "@/utils/profiles/ios";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

const page: React.FC = () => {
  const local = useLocalSearchParams();
  const { songId: id } = local as { songId: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [, setPlaying] = useAtom(playingAtom);

  const navigation = useNavigation();

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
    staleTime: 60 * 1000,
  });

  const backdropUrl = useMemo(
    () =>
      getBackdropUrl({
        api,
        item,
        quality: 90,
        width: 1000,
      }),
    [item]
  );

  const logoUrl = useMemo(
    () => (item?.Type === "Movie" ? getLogoImageUrlById({ api, item }) : null),
    [item]
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
      selectedAudioStream,
      selectedSubtitleStream,
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
        deviceProfile: ios,
        audioStreamIndex: selectedAudioStream,
        subtitleStreamIndex: selectedSubtitleStream,
      });

      console.log("Transcode URL: ", url);

      return url;
    },
    enabled: !!sessionData,
    staleTime: 0,
  });

  const [, setCp] = useAtom(currentlyPlayingItemAtom);

  const onPressPlay = useCallback(
    async (type: "device" | "cast" = "device") => {
      if (!playbackUrl || !item) return;

      setCp({
        item,
        playbackUrl,
      });
      setPlaying(true);
    },
    [playbackUrl, item]
  );

  if (l1)
    return (
      <View className="justify-center items-center h-full">
        <Loader />
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
          <MoviesTitleHeader item={item} />
          <Text className="text-center opacity-50">{item?.ProductionYear}</Text>
        </View>
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
        <View className="flex flex-row items-center justify-between w-full">
          <NextEpisodeButton item={item} type="previous" className="mr-2" />
          <PlayButton
            item={item}
            chromecastReady={false}
            onPress={onPressPlay}
            className="grow"
          />
          <NextEpisodeButton item={item} className="ml-2" />
        </View>
      </View>
      <ScrollView horizontal className="flex px-4 mb-4">
        <View className="flex flex-row space-x-2 ">
          <View className="flex flex-col">
            <Text className="text-sm opacity-70">Audio</Text>
          </View>
          <View className="flex flex-col">
            <Text className="text-sm opacity-70">
              {item.MediaStreams?.find((i) => i.Type === "Audio")?.DisplayTitle}
            </Text>
          </View>
        </View>
      </ScrollView>

      <SimilarItems itemId={item.Id} />

      <View className="h-12"></View>
    </ParallaxScrollView>
  );
};

export default page;
