import { apiAtom } from "@/providers/JellyfinProvider";
import { getBackdrop } from "@/utils/jellyfin";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useState } from "react";
import { View } from "react-native";

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
    staleTime: Infinity,
  });

  const [progress, setProgress] = useState(
    item.UserData?.PlayedPercentage || 0
  );

  if (!url) return <View></View>;

  return (
    <View className="w-48 aspect-video rounded relative overflow-hidden border border-neutral-800">
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
      {progress > 0 && (
        <>
          <View
            style={{
              width: `100%`,
            }}
            className={`absolute bottom-0 left-0 h-1.5 bg-neutral-700 opacity-80 w-full`}
          ></View>
          <View
            style={{
              width: `${progress}%`,
            }}
            className={`absolute bottom-0 left-0 h-1.5 bg-red-600 w-full`}
          ></View>
        </>
      )}
    </View>
  );
};

export default ContinueWatchingPoster;
