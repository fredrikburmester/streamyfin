import { Text } from "@/components/common/Text";
import MoviePoster from "@/components/posters/MoviePoster";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  useQuery,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/react-query";
import { View, ViewProps } from "react-native";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { TouchableItemRouter } from "../common/TouchableItemRouter";
import SeriesPoster from "../posters/SeriesPoster";

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
    <View {...props}>
      <Text className="px-4 text-lg font-bold mb-2 text-neutral-100">
        {title}
      </Text>
      <HorizontalScroll
        data={data}
        extraData={[orientation, isLoading]}
        loading={isLoading}
        renderItem={(item, index) => (
          <TouchableItemRouter
            item={item}
            key={index}
            style={{
              width: orientation === "horizontal" ? 176 : 112,
              zIndex: 100,
            }}
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
        )}
      />
    </View>
  );
};
