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
import { useMemo, useState } from "react";
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

const page: React.FC = () => {
  const local = useLocalSearchParams();
  const { id } = local as { id: string };

  const [playbackURL, setPlaybackURL] = useState<string | null>(null);

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

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
      <View className="flex flex-col px-4 mb-4 pt-4">
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
                <PlayedStatus item={item} />
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
              <Text className="text-center font-bold text-2xl">
                {item?.Name}
              </Text>
              <Text className="text-center opacity-50">
                {item?.ProductionYear}
              </Text>
            </>
          )}
        </View>

        <View className="flex flex-row justify-between items-center w-full my-4">
          {playbackURL && (
            <DownloadItem item={item} playbackURL={playbackURL} />
          )}
          <Chromecast />
        </View>
        <Text>{item.Overview}</Text>
      </View>
      <View className="flex flex-col p-4">
        <VideoPlayer
          itemId={item.Id}
          onChangePlaybackURL={(val) => {
            setPlaybackURL(val);
          }}
        />
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
