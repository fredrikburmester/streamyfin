import {
  BaseItemDto,
  BaseItemPerson,
} from "@jellyfin/sdk/lib/generated-client/models";
import { Image } from "expo-image";
import { View } from "react-native";

type PosterProps = {
  item?: BaseItemDto | BaseItemPerson | null;
  url?: string | null;
  showProgress?: boolean;
};

const Poster: React.FC<PosterProps> = ({ item, url }) => {
  if (!url || !item)
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
    </View>
  );
};

export default Poster;
