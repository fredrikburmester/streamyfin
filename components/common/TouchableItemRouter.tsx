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
        if (item.Type === "Series") router.push(`/series/${item.Id}`);
        if (item.Type === "Episode") router.push(`/items/${item.Id}`);
        if (item.Type === "MusicAlbum") router.push(`/albums/${item.Id}`);
        if (item.Type === "Movie") router.push(`/songs/${item.Id}`);
        if (item.Type === "BoxSet") router.push(`/collections/${item.Id}`);
      }}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};
