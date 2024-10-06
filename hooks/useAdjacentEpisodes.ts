import { Api } from "@jellyfin/sdk";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { useQuery } from "@tanstack/react-query";
import { CurrentlyPlayingState } from "@/providers/PlaybackProvider";
import { useAtom } from "jotai";
import { apiAtom } from "@/providers/JellyfinProvider";

interface AdjacentEpisodesProps {
  item?: BaseItemDto | null;
}

export const useAdjacentEpisodes = ({ item }: AdjacentEpisodesProps) => {
  const [api] = useAtom(apiAtom);

  const { data: previousItem } = useQuery({
    queryKey: ["previousItem", item?.ParentId, item?.IndexNumber],
    queryFn: async (): Promise<BaseItemDto | null> => {
      if (
        !api ||
        !item?.ParentId ||
        item?.IndexNumber === undefined ||
        item?.IndexNumber === null ||
        item?.IndexNumber - 2 < 0
      ) {
        console.log("No previous item");
        return null;
      }

      const res = await getItemsApi(api).getItems({
        parentId: item.ParentId!,
        startIndex: item.IndexNumber! - 2,
        limit: 1,
      });

      return res.data.Items?.[0] || null;
    },
    enabled: item?.Type === "Episode",
  });

  const { data: nextItem } = useQuery({
    queryKey: ["nextItem", item?.ParentId, item?.IndexNumber],
    queryFn: async (): Promise<BaseItemDto | null> => {
      if (
        !api ||
        !item?.ParentId ||
        item?.IndexNumber === undefined ||
        item?.IndexNumber === null
      ) {
        console.log("No next item");
        return null;
      }

      const res = await getItemsApi(api).getItems({
        parentId: item.ParentId!,
        startIndex: item.IndexNumber!,
        limit: 1,
      });

      return res.data.Items?.[0] || null;
    },
    enabled: item?.Type === "Episode",
  });

  return { previousItem, nextItem };
};
