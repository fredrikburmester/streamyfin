import { TouchableOpacity, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { router } from "expo-router";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import MoviePoster from "../MoviePoster";

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
      <Text className="px-4 text-2xl font-bold mb-2">{title}</Text>
      <HorizontalScroll<BaseItemDto>
        data={data}
        height={orientation === "vertical" ? 247 : 164}
        loading={loading}
        renderItem={(item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (item.Type === "Series")
                router.push(`/series/${item.Id}/page`);
              else if (item.Type === "CollectionFolder")
                router.push(`/collections/${item.Id}/page`);
              else router.push(`/items/${item.Id}/page`);
            }}
            className={`flex flex-col
              ${orientation === "vertical" ? "w-32" : "w-48"}
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
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
