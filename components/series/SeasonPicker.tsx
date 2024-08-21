import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { runtimeTicksToSeconds } from "@/utils/time";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { atom, useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { DownloadItem } from "../DownloadItem";
import { Loader } from "../Loader";
import { Text } from "../common/Text";

type Props = {
  item: BaseItemDto;
};

type SeasonIndexState = {
  [seriesId: string]: number;
};

export const seasonIndexAtom = atom<SeasonIndexState>({});

export const SeasonPicker: React.FC<Props> = ({ item }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [seasonIndexState, setSeasonIndexState] = useAtom(seasonIndexAtom);

  const seasonIndex = seasonIndexState[item.Id ?? ""];

  const router = useRouter();

  const { data: seasons } = useQuery({
    queryKey: ["seasons", item.Id],
    queryFn: async () => {
      if (!api || !user?.Id || !item.Id) return [];
      const response = await api.axiosInstance.get(
        `${api.basePath}/Shows/${item.Id}/Seasons`,
        {
          params: {
            userId: user?.Id,
            itemId: item.Id,
            Fields:
              "ItemCounts,PrimaryImageAspectRatio,CanDelete,MediaSourceCount",
          },
          headers: {
            Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
          },
        }
      );

      return response.data.Items;
    },
    enabled: !!api && !!user?.Id && !!item.Id,
  });

  useEffect(() => {
    if (seasons && seasons.length > 0 && seasonIndex === undefined) {
      const firstSeason = seasons[0];
      if (firstSeason.IndexNumber !== undefined) {
        setSeasonIndexState((prev) => ({
          ...prev,
          [item.Id ?? ""]: firstSeason.IndexNumber,
        }));
      }
    }
  }, [seasons, seasonIndex, setSeasonIndexState, item.Id]);
  const selectedSeasonId: string | null = useMemo(
    () =>
      seasons?.find((season: any) => season.IndexNumber === seasonIndex)?.Id,
    [seasons, seasonIndex]
  );

  const { data: episodes, isFetching } = useQuery({
    queryKey: ["episodes", item.Id, selectedSeasonId],
    queryFn: async () => {
      if (!api || !user?.Id || !item.Id) return [];
      const response = await api.axiosInstance.get(
        `${api.basePath}/Shows/${item.Id}/Episodes`,
        {
          params: {
            userId: user?.Id,
            seasonId: selectedSeasonId,
            Fields:
              "ItemCounts,PrimaryImageAspectRatio,CanDelete,MediaSourceCount,Overview",
          },
          headers: {
            Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
          },
        }
      );

      return response.data.Items as BaseItemDto[];
    },
    enabled: !!api && !!user?.Id && !!item.Id && !!selectedSeasonId,
  });

  // Used for height calculation
  const [nrOfEpisodes, setNrOfEpisodes] = useState(0);
  useEffect(() => {
    if (episodes && episodes.length > 0) {
      setNrOfEpisodes(episodes.length);
    }
  }, [episodes]);

  return (
    <View
      style={{
        minHeight: 144 * nrOfEpisodes,
      }}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View className="flex flex-row px-4">
            <TouchableOpacity className="bg-neutral-900 rounded-2xl border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
              <Text>Season {seasonIndex}</Text>
            </TouchableOpacity>
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
          <DropdownMenu.Label>Seasons</DropdownMenu.Label>
          {seasons?.map((season: any) => (
            <DropdownMenu.Item
              key={season.Name}
              onSelect={() => {
                setSeasonIndexState((prev) => ({
                  ...prev,
                  [item.Id ?? ""]: season.IndexNumber,
                }));
              }}
            >
              <DropdownMenu.ItemTitle>{season.Name}</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {/* Old View. Might have a setting later to manually select view. */}
      {/* {episodes && (
        <View className="mt-4">
          <HorizontalScroll<BaseItemDto>
            data={episodes}
            renderItem={(item, index) => (
              <TouchableOpacity
                key={item.Id}
                onPress={() => {
                  router.push(`/(auth)/items/${item.Id}`);
                }}
                className="flex flex-col w-48"
              >
                <ContinueWatchingPoster item={item} />
                <ItemCardText item={item} />
              </TouchableOpacity>
            )}
          />
        </View>
      )} */}
      <View className="px-4 flex flex-col my-4">
        {isFetching ? (
          <View
            style={{
              minHeight: 144 * nrOfEpisodes,
            }}
            className="flex flex-col items-center justify-center"
          >
            <Loader />
          </View>
        ) : (
          episodes?.map((e: BaseItemDto) => (
            <TouchableOpacity
              key={e.Id}
              onPress={() => {
                router.push(`/(auth)/items/${e.Id}`);
              }}
              className="flex flex-col mb-4"
            >
              <View className="flex flex-row items-center mb-2">
                <View className="w-32 aspect-video overflow-hidden mr-2">
                  <ContinueWatchingPoster item={e} width={128} />
                </View>
                <View className="shrink">
                  <Text numberOfLines={2} className="">
                    {e.Name}
                  </Text>
                  <Text numberOfLines={1} className="text-xs text-neutral-500">
                    {`S${e.ParentIndexNumber?.toString()}:E${e.IndexNumber?.toString()}`}
                  </Text>
                  <Text className="text-xs text-neutral-500">
                    {runtimeTicksToSeconds(e.RunTimeTicks)}
                  </Text>
                </View>
                <View className="self-start ml-auto">
                  <DownloadItem item={e} />
                </View>
              </View>

              <Text
                numberOfLines={3}
                className="text-xs text-neutral-500 shrink"
              >
                {e.Overview}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};
