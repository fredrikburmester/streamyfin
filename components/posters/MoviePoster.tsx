import { apiAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { WatchedIndicator } from "@/components/WatchedIndicator";

type MoviePosterProps = {
  item: BaseItemDto;
  showProgress?: boolean;
};

const MoviePoster: React.FC<MoviePosterProps> = ({
  item,
  showProgress = false,
}) => {
  const [api] = useAtom(apiAtom);

  const url = useMemo(() => {
    if (item.Type === "Episode") {
      return `${api?.basePath}/Items/${item.ParentBackdropItemId}/Images/Thumb?fillHeight=389&quality=80&tag=${item.ParentThumbImageTag}`;
    }
    return getPrimaryImageUrl({
      api,
      item,
      width: 300,
    });
  }, [item]);

  const [progress, setProgress] = useState(
    item.UserData?.PlayedPercentage || 0
  );

  const blurhash = useMemo(() => {
    const key = item.ImageTags?.["Primary"] as string;
    return item.ImageBlurHashes?.["Primary"]?.[key];
  }, [item]);

  return (
    <View className="relative rounded-lg overflow-hidden border border-neutral-900">
      <Image
        placeholder={{
          blurhash,
        }}
        key={item.Id}
        id={item.Id}
        source={
          url
            ? {
                uri: url,
              }
            : null
        }
        cachePolicy={"memory-disk"}
        contentFit="cover"
        style={{
          aspectRatio: "10/15",
          width: "100%",
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
