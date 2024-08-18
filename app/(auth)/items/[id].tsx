import { AudioTrackSelector } from "@/components/AudioTrackSelector";
import { Bitrate, BitrateSelector } from "@/components/BitrateSelector";
import {
  currentlyPlayingItemAtom,
  fullScreenAtom,
  playingAtom,
} from "@/components/CurrentlyPlayingBar";
import { Loader } from "@/components/Loader";
import { OverviewText } from "@/components/OverviewText";
import { PlayButton } from "@/components/PlayButton";
import { PlayedStatus } from "@/components/PlayedStatus";
import { Ratings } from "@/components/Ratings";
import { SimilarItems } from "@/components/SimilarItems";
import { SubtitleTrackSelector } from "@/components/SubtitleTrackSelector";
import { Text } from "@/components/common/Text";
import { MoviesTitleHeader } from "@/components/movies/MoviesTitleHeader";
import { CastAndCrew } from "@/components/series/CastAndCrew";
import { CurrentSeries } from "@/components/series/CurrentSeries";
import { NextEpisodeButton } from "@/components/series/NextEpisodeButton";
import { SeriesTitleHeader } from "@/components/series/SeriesTitleHeader";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getLogoImageUrlById } from "@/utils/jellyfin/image/getLogoImageUrlById";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import ios from "@/utils/profiles/ios";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { ParallaxScrollView } from "../../../components/ParallaxPage";

const page: React.FC = () => {
  const local = useLocalSearchParams();
  const { id } = local as { id: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [settings] = useSettings();

  const [, setCurrentlyPlying] = useAtom(currentlyPlayingItemAtom);
  const [, setPlaying] = useAtom(playingAtom);
  const [, setFullscreen] = useAtom(fullScreenAtom);

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
      settings,
    ],
    queryFn: async () => {
      if (!api || !user?.Id || !sessionData) return null;

      let deviceProfile: any = ios;

      if (settings?.deviceProfile === "Native") {
        deviceProfile = native;
      } else if (settings?.deviceProfile === "Old") {
        deviceProfile = old;
      }

      const url = await getStreamUrl({
        api,
        userId: user.Id,
        item,
        startTimeTicks: item?.UserData?.PlaybackPositionTicks || 0,
        maxStreamingBitrate: maxBitrate.value,
        sessionData,
        deviceProfile,
        audioStreamIndex: selectedAudioStream,
        subtitleStreamIndex: selectedSubtitleStream,
        forceDirectPlay: settings?.forceDirectPlay,
      });

      console.log("Transcode URL: ", url);

      return url;
    },
    enabled: !!sessionData && !!api && !!user?.Id && !!item?.Id,
    staleTime: 0,
  });

  const onPressPlay = useCallback(
    async (type: "device" | "cast" = "device") => {
      if (!playbackUrl || !item) return;

      setCurrentlyPlying({
        item,
        playbackUrl,
      });
      setPlaying(true);
      if (settings?.openFullScreenVideoPlayerByDefault === true) {
        setFullscreen(true);
      }
    },
    [playbackUrl, item, settings]
  );

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
          {item.Type === "Episode" ? (
            <SeriesTitleHeader item={item} />
          ) : (
            <>
              <MoviesTitleHeader item={item} />
            </>
          )}
          <Text className="text-center opacity-50">{item?.ProductionYear}</Text>
          <Ratings item={item} />
        </View>

        <View className="flex flex-row justify-between items-center mb-2">
          <PlayedStatus item={item} />
        </View>

        <OverviewText text={item.Overview} />
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
