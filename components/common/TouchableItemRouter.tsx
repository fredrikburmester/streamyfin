import {
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
} from "react-native";
import { Text } from "@/components/common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { PropsWithChildren } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

interface Props extends TouchableOpacityProps {
  item: BaseItemDto;
}

export const TouchableItemRouter: React.FC<PropsWithChildren<Props>> = ({
  item,
  children,
  ...props
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (item.Type === "Series") {
          router.push(`/series/${item.Id}`);
          return;
        }
        if (item.Type === "Episode") {
          router.push(`/items/${item.Id}`);
          return;
        }
        if (item.Type === "MusicAlbum") {
          router.push(`/albums/${item.Id}`);
          return;
        }
        if (item.Type === "Audio") {
          router.push(`/albums/${item.AlbumId}`);
          return;
        }
        if (item.Type === "MusicArtist") {
          router.push(`/artists/${item.Id}/page`);
          return;
        }

        if (item.Type === "BoxSet") {
          router.push(`/collections/${item.Id}`);
          return;
        }

        router.push(`/items/${item.Id}`);
      }}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};
