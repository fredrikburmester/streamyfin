import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import * as Haptics from "expo-haptics";
import { useRouter, useSegments } from "expo-router";
import { PropsWithChildren } from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

interface Props extends TouchableOpacityProps {
  item: BaseItemDto;
}

export const TouchableItemRouter: React.FC<PropsWithChildren<Props>> = ({
  item,
  children,
  ...props
}) => {
  const router = useRouter();
  const segments = useSegments();

  const from = segments[2];

  if (from === "(home)" || from === "(search)" || from === "(libraries)")
    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          if (item.Type === "Series") {
            router.push(`/(auth)/(tabs)/${from}/series/${item.Id}`);
            return;
          }

          if (item.Type === "MusicAlbum") {
            router.push(`/(auth)/(tabs)/${from}/albums/${item.Id}`);
            return;
          }

          if (item.Type === "Audio") {
            router.push(`/(auth)/(tabs)/${from}/albums/${item.AlbumId}`);
            return;
          }

          if (item.Type === "MusicArtist") {
            router.push(`/(auth)/(tabs)/${from}/artists/${item.Id}`);
            return;
          }

          if (item.Type === "Person") {
            router.push(`/(auth)/(tabs)/${from}/actors/${item.Id}`);
            return;
          }

          if (item.Type === "BoxSet") {
            router.push(`/(auth)/(tabs)/${from}/collections/${item.Id}`);
            return;
          }

          if (item.Type === "UserView") {
            router.push(`/(auth)/(tabs)/${from}/collections/${item.Id}`);
            return;
          }

          if (item.Type === "CollectionFolder") {
            router.push(`/(auth)/(tabs)/(libraries)/${item.Id}`);
            return;
          }

          // Same as default
          // if (item.Type === "Episode") {
          //   router.push(`/items/${item.Id}`);
          //   return;
          // }

          router.push(`/(auth)/(tabs)/${from}/items/page?id=${item.Id}`);
        }}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
};
