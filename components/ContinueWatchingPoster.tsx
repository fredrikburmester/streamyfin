import { apiAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { WatchedIndicator } from "./WatchedIndicator";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";

type ContinueWatchingPosterProps = {
  item: BaseItemDto;
};

const ContinueWatchingPoster: React.FC<ContinueWatchingPosterProps> = ({
  item,
}) => {
  const [api] = useAtom(apiAtom);

  const url = useMemo(
    () =>
      getPrimaryImageUrl({
        api,
        item,
        quality: 70,
        width: 300,
      }),
    [item],
  );

  const [progress, setProgress] = useState(
    item.UserData?.PlayedPercentage || 0,
  );

  if (!url)
    return (
      <View className="w-48 aspect-video border border-neutral-800"></View>
    );

  return (
    <View className="w-48 relative aspect-video rounded-lg overflow-hidden border border-neutral-800">
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
            style={{
              width: `100%`,
            }}
            className={`absolute bottom-0 left-0 h-1 bg-neutral-700 opacity-80 w-full`}
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
