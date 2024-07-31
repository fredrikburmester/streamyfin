import { apiAtom } from "@/providers/JellyfinProvider";
import { getBackdrop } from "@/utils/jellyfin";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { View } from "react-native";

type MoviePosterProps = {
  item: BaseItemDto;
};

const MoviePoster: React.FC<MoviePosterProps> = ({ item }) => {
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
    <View className="rounded-md overflow-hidden">
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
      {progress > 0 && <View className="h-1.5 bg-red-600 w-full"></View>}
    </View>
  );
};

export default MoviePoster;
