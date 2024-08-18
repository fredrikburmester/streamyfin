import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { View, ViewProps } from "react-native";
import { ScrollingCollectionList } from "../home/ScrollingCollectionList";
import { Text } from "../common/Text";
import { InfiniteHorizontalScroll } from "../common/InfiniteHorrizontalScroll";
import { TouchableItemRouter } from "../common/TouchableItemRouter";
import MoviePoster from "../posters/MoviePoster";
import { useCallback } from "react";

interface Props extends ViewProps {
  collection: BaseItemDto;
}

export const MediaListSection: React.FC<Props> = ({ collection, ...props }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const fetchItems = useCallback(
    async ({
      pageParam,
    }: {
      pageParam: number;
    }): Promise<BaseItemDtoQueryResult | null> => {
      if (!api || !user?.Id) return null;

      const response = await getItemsApi(api).getItems({
        userId: user.Id,
        parentId: collection.Id,
        startIndex: pageParam,
        limit: 10,
      });

      return response.data;
    },
    [api, user?.Id, collection.Id]
  );

  if (!collection) return null;

  return (
    <View {...props}>
      <Text className="px-4 text-2xl font-bold mb-2 text-neutral-100">
        {collection.Name}
      </Text>
      <InfiniteHorizontalScroll
        height={247}
        renderItem={(item, index) => (
          <TouchableItemRouter
            key={index}
            item={item}
            className={`flex flex-col
              ${"w-32"}
            `}
          >
            <View>
              <MoviePoster item={item} />
            </View>
          </TouchableItemRouter>
        )}
        queryFn={fetchItems}
        queryKey={["media-list", collection.Id!]}
      />
    </View>
  );
};
