import { apiAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImageById } from "@/utils/jellyfin";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { View } from "react-native";

type PosterProps = {
  itemId?: string | null;
  showProgress?: boolean;
};

const Poster: React.FC<PosterProps> = ({ itemId }) => {
  const [api] = useAtom(apiAtom);

  const { data: url } = useQuery({
    queryKey: ["backdrop", itemId],
    queryFn: async () => getPrimaryImageById(api, itemId),
    enabled: !!api && !!itemId,
    staleTime: Infinity,
  });

  if (!url || !itemId)
    return (
      <View
        className="border border-neutral-900"
        style={{
          aspectRatio: "10/15",
        }}
      ></View>
    );

  return (
    <View className="rounded-md overflow-hidden border border-neutral-900">
      <Image
        key={itemId}
        id={itemId}
        source={{
          uri: url,
        }}
        cachePolicy={"memory-disk"}
        contentFit="cover"
        style={{
          aspectRatio: "10/15",
        }}
      />
    </View>
  );
};

export default Poster;
