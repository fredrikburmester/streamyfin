import { Text } from "@/components/common/Text";
import MoviePoster from "@/components/posters/MoviePoster";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { View, ViewProps } from "react-native";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { TouchableItemRouter } from "../common/TouchableItemRouter";
import {
  type QueryKey,
  useQuery,
  type QueryFunction,
} from "@tanstack/react-query";

interface Props extends ViewProps {
  title?: string | null;
  orientation?: "horizontal" | "vertical";
  height?: "small" | "large";
  disabled?: boolean;
  queryKey: QueryKey;
  queryFn: QueryFunction<BaseItemDto[]>;
}

export const ScrollingCollectionList: React.FC<Props> = ({
  title,
  orientation = "vertical",
  height = "small",
  disabled = false,
  queryFn,
  queryKey,
  ...props
}) => {
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn,
    enabled: !disabled,
    staleTime: 0,
  });

  if (disabled || !title) return null;

  return (
    <View {...props}>
      <Text className="px-4 text-2xl font-bold mb-2 text-neutral-100">
        {title}
      </Text>
      <HorizontalScroll<BaseItemDto>
        data={data}
        height={orientation === "vertical" ? 247 : 164}
        loading={isLoading}
        renderItem={(item, index) => (
          <TouchableItemRouter
            key={index}
            item={item}
            className={`flex flex-col
              ${orientation === "vertical" ? "w-28" : "w-44"}
            `}
          >
            <View>
              {orientation === "vertical" ? (
                <MoviePoster item={item} />
              ) : (
                <ContinueWatchingPoster item={item} />
              )}
              <ItemCardText item={item} />
            </View>
          </TouchableItemRouter>
        )}
      />
    </View>
  );
};
