import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { View, ViewProps } from "react-native";
import { MoviesTitleHeader } from "./movies/MoviesTitleHeader";
import { Ratings } from "./Ratings";
import { EpisodeTitleHeader } from "./series/EpisodeTitleHeader";

interface Props extends ViewProps {
  item?: BaseItemDto | null;
}

export const ItemHeader: React.FC<Props> = ({ item, ...props }) => {
  if (!item)
    return (
      <View className="w-full items-center">
        <View className="w-1/3 h-4 mb-1 bg-neutral-950 rounded" />
        <View className="w-2/3 h-8 mb-1 bg-neutral-950 rounded" />
        <View className="w-2/3 h-3 mb-1 bg-neutral-950 rounded" />
        <View className="w-1/4 h-3 mb-1 bg-neutral-950 rounded" />
        <View className="w-1/4 h-6 bg-neutral-950 rounded" />
      </View>
    );

  return (
    <View className="flex flex-col" {...props}>
      <Ratings item={item} className="mb-2" />
      {item.Type === "Episode" && <EpisodeTitleHeader item={item} />}
      {item.Type === "Movie" && <MoviesTitleHeader item={item} />}
    </View>
  );
};
