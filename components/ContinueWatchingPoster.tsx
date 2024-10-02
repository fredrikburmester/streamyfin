import { apiAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { WatchedIndicator } from "./WatchedIndicator";
import React from "react";

type ContinueWatchingPosterProps = {
  item: BaseItemDto;
  width?: number;
  useEpisodePoster?: boolean;
};

const ContinueWatchingPoster: React.FC<ContinueWatchingPosterProps> = ({
  item,
  useEpisodePoster = false,
}) => {
  const [api] = useAtom(apiAtom);

  /**
   * Get horrizontal poster for movie and episode, with failover to primary.
   */
  const url = useMemo(() => {
    if (!api) return;
    if (item.Type === "Episode" && useEpisodePoster) {
      return `${api?.basePath}/Items/${item.Id}/Images/Primary?fillHeight=389&quality=80`;
    }
    if (item.Type === "Episode") {
      if (item.ParentBackdropItemId && item.ParentThumbImageTag)
        return `${api?.basePath}/Items/${item.ParentBackdropItemId}/Images/Thumb?fillHeight=389&quality=80&tag=${item.ParentThumbImageTag}`;
      else
        return `${api?.basePath}/Items/${item.Id}/Images/Primary?fillHeight=389&quality=80`;
    }
    if (item.Type === "Movie") {
      if (item.ImageTags?.["Thumb"])
        return `${api?.basePath}/Items/${item.Id}/Images/Thumb?fillHeight=389&quality=80&tag=${item.ImageTags?.["Thumb"]}`;
      else
        return `${api?.basePath}/Items/${item.Id}/Images/Primary?fillHeight=389&quality=80`;
    }
  }, [item]);

  const [progress, setProgress] = useState(
    item.UserData?.PlayedPercentage || 0
  );

  if (!url)
    return (
      <View className="aspect-video border border-neutral-800 w-44"></View>
    );

  return (
    <View className="relative w-44 aspect-video rounded-lg overflow-hidden border border-neutral-800">
      <Image
        key={item.Id}
        id={item.Id}
        source={{
          uri: url,
        }}
        cachePolicy={"memory-disk"}
        contentFit="cover"
        className="w-full h-full"
      />
      {!progress && <WatchedIndicator item={item} />}
      {progress > 0 && (
        <>
          <View
            className={`absolute w-100 bottom-0 left-0 h-1 bg-neutral-700 opacity-80 w-full`}
          ></View>
          <View
            style={{
              width: `${progress}%`,
            }}
            className={`absolute bottom-0 left-0 h-1 bg-purple-600 w-full`}
          ></View>
        </>
      )}
    </View>
  );
};

export default ContinueWatchingPoster;
