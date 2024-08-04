import { apiAtom } from "@/providers/JellyfinProvider";
import { getBackdrop } from "@/utils/jellyfin";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useState } from "react";
import { View } from "react-native";
import { Text } from "./common/Text";
import { WatchedIndicator } from "./WatchedIndicator";

type ContinueWatchingPosterProps = {
  item: BaseItemDto;
};

const ContinueWatchingPoster: React.FC<ContinueWatchingPosterProps> = ({
  item,
}) => {
  const [api] = useAtom(apiAtom);

  const { data: url } = useQuery({
    queryKey: ["backdrop", item.Id],
    queryFn: async () => getBackdrop(api, item),
    enabled: !!api && !!item.Id,
    staleTime: 60 * 60 * 24 * 7,
  });

  const [progress, setProgress] = useState(
    item.UserData?.PlayedPercentage || 0
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
      <WatchedIndicator item={item} />
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
            className={`absolute bottom-0 left-0 h-1 bg-red-600 w-full`}
          ></View>
        </>
      )}
    </View>
  );
};

export default ContinueWatchingPoster;
