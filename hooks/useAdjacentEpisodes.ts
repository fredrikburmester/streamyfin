import { Api } from "@jellyfin/sdk";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { useQuery } from "@tanstack/react-query";
import { CurrentlyPlayingState } from "@/providers/PlaybackProvider";
import { useAtom } from "jotai";
import { apiAtom } from "@/providers/JellyfinProvider";

interface AdjacentEpisodesProps {
  currentlyPlaying?: CurrentlyPlayingState | null;
}

export const useAdjacentEpisodes = ({
  currentlyPlaying,
}: AdjacentEpisodesProps) => {
  const [api] = useAtom(apiAtom);

  const { data: previousItem } = useQuery({
    queryKey: [
      "previousItem",
      currentlyPlaying?.item.ParentId,
      currentlyPlaying?.item.IndexNumber,
    ],
    queryFn: async (): Promise<BaseItemDto | null> => {
      if (
        !api ||
        !currentlyPlaying?.item.ParentId ||
        currentlyPlaying?.item.IndexNumber === undefined ||
        currentlyPlaying?.item.IndexNumber === null ||
        currentlyPlaying.item.IndexNumber - 2 < 0
      ) {
        console.log("No previous item");
        return null;
      }

      const res = await getItemsApi(api).getItems({
        parentId: currentlyPlaying.item.ParentId!,
        startIndex: currentlyPlaying.item.IndexNumber! - 2,
        limit: 1,
      });

      console.log(
        "Prev: ",
        res.data.Items?.map((i) => i.Name)
      );
      return res.data.Items?.[0] || null;
    },
    enabled: currentlyPlaying?.item.Type === "Episode",
  });

  const { data: nextItem } = useQuery({
    queryKey: [
      "nextItem",
      currentlyPlaying?.item.ParentId,
      currentlyPlaying?.item.IndexNumber,
    ],
    queryFn: async (): Promise<BaseItemDto | null> => {
      if (
        !api ||
        !currentlyPlaying?.item.ParentId ||
        currentlyPlaying?.item.IndexNumber === undefined ||
        currentlyPlaying?.item.IndexNumber === null
      ) {
        console.log("No next item");
        return null;
      }

      const res = await getItemsApi(api).getItems({
        parentId: currentlyPlaying.item.ParentId!,
        startIndex: currentlyPlaying.item.IndexNumber!,
        limit: 1,
      });

      console.log(
        "Next: ",
        res.data.Items?.map((i) => i.Name)
      );
      return res.data.Items?.[0] || null;
    },
    enabled: currentlyPlaying?.item.Type === "Episode",
  });

  return { previousItem, nextItem };
};
