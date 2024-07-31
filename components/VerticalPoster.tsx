import { apiAtom } from "@/providers/JellyfinProvider";
import { getBackdrop } from "@/utils/jellyfin";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { View } from "react-native";

type VerticalPosterProps = {
  item: BaseItemDto;
};

const VerticalPoster: React.FC<VerticalPosterProps> = ({ item }) => {
  const [api] = useAtom(apiAtom);

  const { data: url } = useQuery({
    queryKey: ["backdrop", item.Id],
    queryFn: async () => getBackdrop(api, item),
    enabled: !!api && !!item.Id,
    staleTime: Infinity,
  });

  if (!url) return null;

  return (
    <View>
      <Image
        source={{
          uri: url,
        }}
        style={{
          height: 180,
          width: 130,
          borderRadius: 10,
        }}
      />
    </View>
  );
};

export default VerticalPoster;
