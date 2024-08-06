import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { Text } from "../common/Text";
import * as DropdownMenu from "zeego/dropdown-menu";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { router } from "expo-router";

type Props = {
  item: BaseItemDto;
};

export const SeasonPicker: React.FC<Props> = ({ item }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

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

  const { data: episodes } = useQuery({
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

  useEffect(() => {
    if (!seasons || seasons.length === 0) return;

    setSelectedSeasonId(
      seasons.find((season: any) => season.IndexNumber === 1)?.Id
    );
    setSelectedSeason(1);
  }, [seasons]);

  return (
    <View className="mb-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View className="flex flex-row px-4">
            <TouchableOpacity className="bg-neutral-900 rounded-2xl border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
              <Text>Season {selectedSeason}</Text>
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
                setSelectedSeason(season.IndexNumber);
                setSelectedSeasonId(season.Id);
              }}
            >
              <DropdownMenu.ItemTitle>{season.Name}</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {episodes && (
        <View className="mt-4">
          <HorizontalScroll<BaseItemDto>
            data={episodes}
            renderItem={(item, index) => (
              <TouchableOpacity
                key={item.Id}
                onPress={() => {
                  router.push(`/(auth)/items/${item.Id}/page`);
                }}
                className="flex flex-col w-48"
              >
                <ContinueWatchingPoster item={item} />
                <ItemCardText item={item} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};
