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

const SeriesPoster: React.FC<MoviePosterProps> = ({ item }) => {
  const [api] = useAtom(apiAtom);

  const url = useMemo(
    () =>
      getPrimaryImageUrl({
        api,
        item,
      }),
    [item]
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
    </View>
  );
};

export default SeriesPoster;
