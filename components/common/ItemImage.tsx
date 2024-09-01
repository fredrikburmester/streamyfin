import { useImageColors } from "@/hooks/useImageColors";
import { apiAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Image, ImageProps, ImageSource } from "expo-image";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { View } from "react-native";

interface Props extends ImageProps {
  item: BaseItemDto;
  variant?:
    | "Primary"
    | "Backdrop"
    | "ParentBackdrop"
    | "ParentLogo"
    | "Logo"
    | "AlbumPrimary"
    | "SeriesPrimary"
    | "Screenshot"
    | "Thumb";
  quality?: number;
  width?: number;
}

export const ItemImage: React.FC<Props> = ({
  item,
  variant = "Primary",
  quality = 90,
  width = 1000,
  ...props
}) => {
  const [api] = useAtom(apiAtom);

  const source = useMemo(() => {
    if (!api) return null;

    let tag: string | null | undefined;
    let blurhash: string | null | undefined;
    let src: ImageSource | null = null;

    console.log("ImageItem ~ " + variant, item.Name, item.ImageTags);

    switch (variant) {
      case "Backdrop":
        if (item.Type === "Episode") {
          tag = item.ParentBackdropImageTags?.[0];
          if (!tag) break;
          blurhash = item.ImageBlurHashes?.Backdrop?.[tag];
          src = {
            uri: `${api.basePath}/Items/${item.ParentBackdropItemId}/Images/Backdrop/0?quality=${quality}&tag=${tag}&width=${width}`,
            blurhash,
          };
          break;
        }

        tag = item.BackdropImageTags?.[0];
        if (!tag) break;
        blurhash = item.ImageBlurHashes?.Backdrop?.[tag];
        src = {
          uri: `${api.basePath}/Items/${item.Id}/Images/Backdrop/0?quality=${quality}&tag=${tag}&width=${width}`,
          blurhash,
        };
        break;
      case "Primary":
        tag = item.ImageTags?.["Primary"];
        if (!tag) break;
        blurhash = item.ImageBlurHashes?.Primary?.[tag];

        src = {
          uri: `${api.basePath}/Items/${item.Id}/Images/Primary?quality=${quality}&tag=${tag}&width=${width}`,
          blurhash,
        };
        break;
      case "Thumb":
        tag = item.ImageTags?.["Thumb"];
        if (!tag) break;
        blurhash = item.ImageBlurHashes?.Thumb?.[tag];

        src = {
          uri: `${api.basePath}/Items/${item.Id}/Images/Backdrop?quality=${quality}&tag=${tag}&width=${width}`,
          blurhash,
        };
        break;
      default:
        tag = item.ImageTags?.["Primary"];
        src = {
          uri: `${api.basePath}/Items/${item.Id}/Images/Primary?quality=${quality}&tag=${tag}&width=${width}`,
        };
        break;
    }

    console.log("src: ", src?.uri?.slice(0, 30));

    return src;
  }, [item.ImageTags]);

  useImageColors(source?.uri);

  // return placeholder icon if no source
  if (!source?.uri) return;
  <View {...props}>
    <Ionicons name="image-outline" size={24} color="white" />;
  </View>;

  return (
    <Image
      cachePolicy={"memory-disk"}
      transition={300}
      placeholder={{
        blurhash: source?.blurhash,
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
      source={{
        uri: source?.uri,
      }}
      {...props}
    />
  );
};
