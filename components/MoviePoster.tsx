import { apiAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImage, getPrimaryImageById } from "@/utils/jellyfin";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { WatchedIndicator } from "./WatchedIndicator";

type MoviePosterProps = {
  item: BaseItemDto;
  showProgress?: boolean;
};

const MoviePoster: React.FC<MoviePosterProps> = ({
  item,
  showProgress = false,
}) => {
  const [api] = useAtom(apiAtom);

  const url = useMemo(
    () =>
      getPrimaryImage({
        api,
        item,
      }),
    [item]
  );

  const [progress, setProgress] = useState(
    item.UserData?.PlayedPercentage || 0
  );

  if (!url)
    return (
      <View
        className="rounded-md overflow-hidden border border-neutral-900"
        style={{
          aspectRatio: "10/15",
        }}
      ></View>
    );

  return (
    <View className="relative rounded-md overflow-hidden border border-neutral-900">
      <Image
        key={item.Id}
        id={item.Id}
        source={{
          uri: url,
        }}
        cachePolicy={"memory-disk"}
        contentFit="cover"
        style={{
          aspectRatio: "10/15",
        }}
      />
      <WatchedIndicator item={item} />
      {showProgress && progress > 0 && (
        <View className="h-1 bg-red-600 w-full"></View>
      )}
    </View>
  );
};

export default MoviePoster;
