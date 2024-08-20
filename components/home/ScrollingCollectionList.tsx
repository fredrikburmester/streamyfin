import { Text } from "@/components/common/Text";
import MoviePoster from "@/components/posters/MoviePoster";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { View, ViewProps } from "react-native";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { TouchableItemRouter } from "../common/TouchableItemRouter";

interface Props extends ViewProps {
  title: string;
  loading?: boolean;
  orientation?: "horizontal" | "vertical";
  data?: BaseItemDto[] | null;
  height?: "small" | "large";
  disabled?: boolean;
}

export const ScrollingCollectionList: React.FC<Props> = ({
  title,
  data,
  orientation = "vertical",
  height = "small",
  loading = false,
  disabled = false,
  ...props
}) => {
  if (disabled) return null;

  return (
    <View {...props}>
      <Text className="px-4 text-2xl font-bold mb-2 text-neutral-100">
        {title}
      </Text>
      <HorizontalScroll<BaseItemDto>
        data={data}
        height={orientation === "vertical" ? 247 : 164}
        loading={loading}
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
