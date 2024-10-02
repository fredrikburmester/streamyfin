import { Text } from "@/components/common/Text";
import MoviePoster from "@/components/posters/MoviePoster";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  useQuery,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/react-query";
import { ScrollView, View, ViewProps } from "react-native";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { TouchableItemRouter } from "../common/TouchableItemRouter";
import SeriesPoster from "../posters/SeriesPoster";
import { FlashList } from "@shopify/flash-list";

interface Props extends ViewProps {
  title?: string | null;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  queryKey: QueryKey;
  queryFn: QueryFunction<BaseItemDto[]>;
}

export const ScrollingCollectionList: React.FC<Props> = ({
  title,
  orientation = "vertical",
  disabled = false,
  queryFn,
  queryKey,
  ...props
}) => {
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn,
    enabled: !disabled,
    staleTime: 60 * 1000,
  });

  if (disabled || !title) return null;

  return (
    <View {...props} className="">
      <Text className="px-4 text-lg font-bold mb-2 text-neutral-100">
        {title}
      </Text>
      {isLoading ? (
        <View
          className={`
            flex flex-row gap-2 px-4
        `}
        >
          {[1, 2, 3].map((i) => (
            <View className="w-44 mb-2">
              <View className="bg-neutral-800 h-24 w-full rounded-md mb-2"></View>
              <View className="bg-neutral-800 h-4 w-full rounded-md mb-2"></View>
              <View className="bg-neutral-800 h-4 w-1/2 rounded-md"></View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="px-4 flex flex-row">
            {data?.map((item, index) => (
              <TouchableItemRouter
                item={item}
                key={index}
                className={`
              mr-2 

              ${orientation === "horizontal" ? "w-44" : "w-28"}
            `}
              >
                {item.Type === "Episode" && orientation === "horizontal" && (
                  <ContinueWatchingPoster item={item} />
                )}
                {item.Type === "Episode" && orientation === "vertical" && (
                  <SeriesPoster item={item} />
                )}
                {item.Type === "Movie" && orientation === "horizontal" && (
                  <ContinueWatchingPoster item={item} />
                )}
                {item.Type === "Movie" && orientation === "vertical" && (
                  <MoviePoster item={item} />
                )}
                {item.Type === "Series" && <SeriesPoster item={item} />}
                <ItemCardText item={item} />
              </TouchableItemRouter>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};
