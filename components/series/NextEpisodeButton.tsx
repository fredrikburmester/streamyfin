import { Ionicons } from "@expo/vector-icons";
import { Button } from "../Button";
import { useRouter } from "expo-router";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useMemo } from "react";

interface Props extends React.ComponentProps<typeof Button> {
  item: BaseItemDto;
  type?: "next" | "previous";
}

export const NextEpisodeButton: React.FC<Props> = ({
  item,
  type = "next",
  ...props
}) => {
  const router = useRouter();

  const [user] = useAtom(userAtom);
  const [api] = useAtom(apiAtom);

  // const { data: seasons } = useQuery({
  //   queryKey: ["seasons", item.SeriesId],
  //   queryFn: async () => {
  //     if (
  //       !api ||
  //       !user?.Id ||
  //       !item?.Id ||
  //       !item?.SeriesId ||
  //       !item?.IndexNumber
  //     )
  //       return [];

  //     const response = await getItemsApi(api).getItems({
  //       parentId: item?.SeriesId,
  //     });

  //     console.log("seasons ~", type, response.data);

  //     return (response.data.Items as BaseItemDto[]) ?? [];
  //   },
  //   enabled: Boolean(api && user?.Id && item?.Id && item.SeasonId),
  // });

  // const nextSeason = useMemo(() => {
  //   if (!seasons) return null;
  //   const currentSeasonIndex = seasons.findIndex(
  //     (season) => season.Id === item.SeasonId,
  //   );

  //   if (currentSeasonIndex === seasons.length - 1) return null;

  //   return seasons[currentSeasonIndex + 1];
  // }, [seasons]);

  const { data: nextEpisode } = useQuery({
    queryKey: ["nextEpisode", item.Id, item.ParentId, type],
    queryFn: async () => {
      if (
        !api ||
        !user?.Id ||
        !item?.Id ||
        !item?.ParentId ||
        !item?.IndexNumber
      )
        return null;

      const response = await getItemsApi(api).getItems({
        parentId: item?.ParentId,
        limit: 1,
        startIndex: type === "next" ? item.IndexNumber : item.IndexNumber - 2,
      });

      return (response.data.Items?.[0] as BaseItemDto) || null;
    },
    enabled: Boolean(api && user?.Id && item?.Id && item.SeasonId),
  });

  const disabled = useMemo(() => {
    if (!nextEpisode) return true;
    if (nextEpisode.Id === item.Id) return true;
    return false;
  }, [nextEpisode, type]);

  if (item.Type !== "Episode") return null;

  return (
    <Button
      onPress={() => router.push(`/items/${nextEpisode?.Id}`)}
      className={`h-12 aspect-square`}
      disabled={disabled}
      {...props}
    >
      {type === "next" ? (
        <Ionicons name="chevron-forward" size={24} color="white" />
      ) : (
        <Ionicons name="chevron-back" size={24} color="white" />
      )}
    </Button>
  );
};
