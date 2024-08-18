import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { atom, useAtom } from "jotai";
import { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { Text } from "../common/Text";

type Props = {
  item: BaseItemDto;
};

export const seasonIndexAtom = atom<number>(1);

export const SeasonPicker: React.FC<Props> = ({ item }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [seasonIndex, setSeasonIndex] = useAtom(seasonIndexAtom);

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

  const selectedSeasonId: string | null = useMemo(
    () =>
      seasons?.find((season: any) => season.IndexNumber === seasonIndex)?.Id,
    [seasons, seasonIndex]
  );

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

  return (
    <View className="mb-2">
      {episodes && (
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
      )}
    </View>
  );
};
