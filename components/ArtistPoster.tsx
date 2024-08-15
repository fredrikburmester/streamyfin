import { apiAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { WatchedIndicator } from "./WatchedIndicator";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";

type ArtistPosterProps = {
  item: BaseItemDto;
  showProgress?: boolean;
};

const ArtistPoster: React.FC<ArtistPosterProps> = ({
  item,
  showProgress = false,
}) => {
  const [api] = useAtom(apiAtom);

  const url = useMemo(
    () =>
      getPrimaryImageUrl({
        api,
        item,
      }),
    [item],
  );

  if (!url)
    return (
      <View
        className="rounded-md overflow-hidden border border-neutral-900"
        style={{
          aspectRatio: "1/1",
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
          aspectRatio: "1/1",
        }}
      />
    </View>
  );
};

export default ArtistPoster;
