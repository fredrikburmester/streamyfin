import { TouchableOpacityProps, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { TouchableItemRouter } from "../common/TouchableItemRouter";
import {
  BaseItemDto,
  BaseItemKind,
  CollectionType,
} from "@jellyfin/sdk/lib/generated-client/models";
import { Image } from "expo-image";
import { getColors, ImageColorsResult } from "react-native-image-colors";
import { useQuery } from "@tanstack/react-query";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { sortBy } from "lodash";
import { useSettings } from "@/utils/atoms/settings";
import { Ionicons } from "@expo/vector-icons";

interface Props extends TouchableOpacityProps {
  library: BaseItemDto;
}

type LibraryColor = {
  dominantColor: string;
  averageColor: string;
  secondary: string;
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const icons: Record<CollectionType, IconName> = {
  movies: "film",
  tvshows: "tv",
  music: "musical-notes",
  books: "book",
  homevideos: "videocam",
  boxsets: "albums",
  playlists: "list",
  folders: "folder",
  livetv: "tv",
  musicvideos: "musical-notes",
  photos: "images",
  trailers: "videocam",
  unknown: "help-circle",
} as const;
export const LibraryItemCard: React.FC<Props> = ({ library, ...props }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [settings] = useSettings();

  const [imageInfo, setImageInfo] = useState<LibraryColor>({
    dominantColor: "#fff",
    averageColor: "#fff",
    secondary: "#fff",
  });

  const url = useMemo(
    () =>
      getPrimaryImageUrl({
        api,
        item: library,
      }),
    [library]
  );

  const { data: itemsCount } = useQuery({
    queryKey: ["library-count", library.Id],
    queryFn: async () => {
      if (!api) return null;
      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        parentId: library.Id,
        limit: 0,
      });
      return response.data.TotalRecordCount;
    },
  });

  useEffect(() => {
    if (url) {
      getColors(url, {
        fallback: "#fff",
        cache: true,
        key: url,
      })
        .then((colors) => {
          let dominantColor: string = "#fff";
          let averageColor: string = "#fff";
          let secondary: string = "#fff";

          if (colors.platform === "android") {
            dominantColor = colors.dominant;
            averageColor = colors.average;
            secondary = colors.muted;
          } else if (colors.platform === "ios") {
            dominantColor = colors.primary;
            averageColor = colors.background;
            secondary = colors.detail;
          }

          setImageInfo({
            dominantColor,
            averageColor,
            secondary,
          });
        })
        .catch((error) => {
          console.log("Error getting colors", error);
        });
    }
  }, [url]);

  if (!url) return null;

  if (settings?.libraryOptions?.display === "row") {
    return (
      <TouchableItemRouter item={library} className="w-full px-4">
        <View className="flex flex-row items-center w-full relative ">
          <Ionicons
            name={icons[library.CollectionType!] || "folder"}
            size={22}
            color={"#e5e5e5"}
          />
          <Text className="text-start px-4 text-neutral-200">
            {library.Name}
          </Text>
          {settings?.libraryOptions?.showStats && (
            <Text className="font-bold text-xs text-neutral-500 text-start px-4 ml-auto">
              {itemsCount} items
            </Text>
          )}
        </View>
      </TouchableItemRouter>
    );
  }

  if (settings?.libraryOptions?.imageStyle === "cover") {
    return (
      <TouchableItemRouter item={library} className="w-full">
        <View className="flex justify-center rounded-xl w-full relative border border-neutral-900 h-20 ">
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 8,
              position: "absolute",
              top: 0,
              left: 0,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: url }}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.3)", // Adjust the alpha value (0.3) to control darkness
              }}
            />
          </View>
          {settings?.libraryOptions?.showTitles && (
            <Text className="font-bold text-lg text-start px-4">
              {library.Name}
            </Text>
          )}
          {settings?.libraryOptions?.showStats && (
            <Text className="font-bold text-xs  text-start px-4">
              {itemsCount} items
            </Text>
          )}
        </View>
      </TouchableItemRouter>
    );
  }

  return (
    <TouchableItemRouter item={library} {...props}>
      <View className="flex flex-row items-center justify-between rounded-xl w-full relative border bg-neutral-900 border-neutral-900 h-20">
        <View className="flex flex-col">
          <Text className="font-bold text-lg text-start px-4">
            {library.Name}
          </Text>
          {settings?.libraryOptions?.showStats && (
            <Text className="font-bold text-xs text-neutral-500 text-start px-4">
              {itemsCount} items
            </Text>
          )}
        </View>
        <View className="p-2">
          <Image
            source={{ uri: url }}
            className="h-full aspect-[2/1] object-cover rounded-lg overflow-hidden"
          />
        </View>
      </View>
    </TouchableItemRouter>
  );
};
