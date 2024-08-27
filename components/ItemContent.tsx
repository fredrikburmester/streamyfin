import { AudioTrackSelector } from "@/components/AudioTrackSelector";
import { Bitrate, BitrateSelector } from "@/components/BitrateSelector";
import { DownloadItem } from "@/components/DownloadItem";
import { OverviewText } from "@/components/OverviewText";
import { ParallaxScrollView } from "@/components/ParallaxPage";
import { PlayButton } from "@/components/PlayButton";
import { PlayedStatus } from "@/components/PlayedStatus";
import { SimilarItems } from "@/components/SimilarItems";
import { SubtitleTrackSelector } from "@/components/SubtitleTrackSelector";
import { ItemImage } from "@/components/common/ItemImage";
import { CastAndCrew } from "@/components/series/CastAndCrew";
import { CurrentSeries } from "@/components/series/CurrentSeries";
import { SeasonEpisodesCarousel } from "@/components/series/SeasonEpisodesCarousel";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getLogoImageUrlById } from "@/utils/jellyfin/image/getLogoImageUrlById";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import { chromecastProfile } from "@/utils/profiles/chromecast";
import ios from "@/utils/profiles/ios";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";
import { MediaSourceInfo } from "@jellyfin/sdk/lib/generated-client/models";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useNavigation } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useCastDevice } from "react-native-google-cast";
import { Chromecast } from "./Chromecast";
import { ItemHeader } from "./ItemHeader";
import { MediaSourceSelector } from "./MediaSourceSelector";
import { useImageColors } from "@/hooks/useImageColors";

export const ItemContent: React.FC<{ id: string }> = React.memo(({ id }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [settings] = useSettings();
  const castDevice = useCastDevice();
  const navigation = useNavigation();

  const [selectedMediaSource, setSelectedMediaSource] =
    useState<MediaSourceInfo | null>(null);
  const [selectedAudioStream, setSelectedAudioStream] = useState<number>(-1);
  const [selectedSubtitleStream, setSelectedSubtitleStream] =
    useState<number>(0);
  const [maxBitrate, setMaxBitrate] = useState<Bitrate>({
    key: "Max",
    value: undefined,
  });

  const headerHeightRef = useRef(0);

  const {
    data: item,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const res = await getUserItemData({
        api,
        userId: user?.Id,
        itemId: id,
      });

      return res;
    },
    enabled: !!id && !!api,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        item && (
          <View className="flex flex-row items-center space-x-2">
            <Chromecast background="blur" width={22} height={22} />
            <DownloadItem item={item} />
            <PlayedStatus item={item} />
          </View>
        ),
    });
  }, [item]);

  useEffect(() => {
    if (item?.Type === "Episode") headerHeightRef.current = 400;
    else headerHeightRef.current = 500;
  }, [item]);

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
      selectedMediaSource,
      selectedAudioStream,
      selectedSubtitleStream,
      settings,
    ],
    queryFn: async () => {
      if (!api || !user?.Id || !sessionData) return null;

      let deviceProfile: any = ios;

      if (castDevice?.deviceId) {
        deviceProfile = chromecastProfile;
      } else if (settings?.deviceProfile === "Native") {
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
        height: maxBitrate.height,
        mediaSourceId: selectedMediaSource?.Id,
      });

      console.info("Stream URL:", url);

      return url;
    },
    enabled: !!sessionData && !!api && !!user?.Id && !!item?.Id,
    staleTime: 0,
  });

  const logoUrl = useMemo(() => getLogoImageUrlById({ api, item }), [item]);

  const loading = useMemo(
    () => isLoading || isFetching,
    [isLoading, isFetching]
  );

  return (
    <ParallaxScrollView
      headerHeight={headerHeightRef.current}
      headerImage={
        <>
          {item ? (
            <ItemImage
              variant={
                item.Type === "Movie" && logoUrl ? "Backdrop" : "Primary"
              }
              item={item}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "black",
              }}
            ></View>
          )}
        </>
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
      <View className="flex flex-col bg-transparent">
        <View className="flex flex-col px-4 w-full space-y-2 pt-2 mb-2">
          <ItemHeader item={item} className="mb-4" />

          {item ? (
            <View className="flex flex-row items-center space-x-2 w-full">
              <BitrateSelector
                onChange={(val) => setMaxBitrate(val)}
                selected={maxBitrate}
              />
              <MediaSourceSelector
                item={item}
                onChange={setSelectedMediaSource}
                selected={selectedMediaSource}
              />
              {selectedMediaSource && (
                <View className="flex flex-row items-center space-x-2">
                  <AudioTrackSelector
                    source={selectedMediaSource}
                    onChange={setSelectedAudioStream}
                    selected={selectedAudioStream}
                  />
                  <SubtitleTrackSelector
                    source={selectedMediaSource}
                    onChange={setSelectedSubtitleStream}
                    selected={selectedSubtitleStream}
                  />
                </View>
              )}
            </View>
          ) : (
            <View className="mb-1">
              <View className="bg-neutral-950 h-4 w-2/4 rounded-md mb-1"></View>
              <View className="bg-neutral-950 h-10 w-3/4 rounded-lg"></View>
            </View>
          )}

          <PlayButton item={item} url={playbackUrl} className="grow" />
        </View>

        {item?.Type === "Episode" && (
          <SeasonEpisodesCarousel item={item} loading={loading} />
        )}

        <OverviewText text={item?.Overview} className="px-4 mb-4" />

        <CastAndCrew item={item} className="mb-4" loading={loading} />

        {item?.Type === "Episode" && (
          <CurrentSeries item={item} className="mb-4" />
        )}
        <SimilarItems itemId={item?.Id} />

        <View className="h-16"></View>
      </View>
    </ParallaxScrollView>
  );
});
