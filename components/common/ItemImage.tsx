import { useImageColors } from "@/hooks/useImageColors";
import { apiAtom } from "@/providers/JellyfinProvider";
import { getItemImage } from "@/utils/getItemImage";
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
  onError?: () => void;
}

export const ItemImage: React.FC<Props> = ({
  item,
  variant = "Primary",
  quality = 90,
  width = 1000,
  onError,
  ...props
}) => {
  const [api] = useAtom(apiAtom);

  const source = useMemo(() => {
    if (!api) {
      onError && onError();
      return;
    }
    return getItemImage({
      item,
      api,
      variant,
      quality,
      width,
    });
  }, [api, item, quality, variant, width]);

  // return placeholder icon if no source
  if (!source?.uri)
    return (
      <View
        {...props}
        className="flex flex-col items-center justify-center border border-neutral-800 bg-neutral-900"
      >
        <Ionicons
          name="image-outline"
          size={24}
          color="white"
          style={{ opacity: 0.4 }}
        />
      </View>
    );

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
