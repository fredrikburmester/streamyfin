import { Text } from "@/components/common/Text";
import { ParallaxScrollView } from "@/components/ParallaxPage";
import { NextUp } from "@/components/series/NextUp";
import { SeasonPicker } from "@/components/series/SeasonPicker";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  getBackdrop,
  getLogoImageById,
  getPrimaryImage,
  getPrimaryImageById,
  getUserItemData,
} from "@/utils/jellyfin";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { View } from "react-native";

const page: React.FC = () => {
  const params = useLocalSearchParams();
  const { id: seriesId } = params as { id: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: item } = useQuery({
    queryKey: ["series", seriesId],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId: seriesId,
      }),
    enabled: !!seriesId && !!api,
    staleTime: 0,
  });

  const backdropUrl = useMemo(
    () =>
      getBackdrop({
        api,
        item,
        quality: 90,
        width: 1000,
      }),
    [item]
  );

  const logoUrl = useMemo(
    () =>
      getLogoImageById({
        api,
        item,
      }),
    [item]
  );

  if (!item || !backdropUrl) return null;

  return (
    <ParallaxScrollView
      headerImage={
        <Image
          source={{
            uri: backdropUrl,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      }
      logo={
        <>
          {logoUrl ? (
            <Image
              source={{
                uri: logoUrl,
              }}
              style={{
                height: 130,
                width: "100%",
                resizeMode: "contain",
              }}
            />
          ) : null}
        </>
      }
    >
      <View className="flex flex-col pt-4 pb-12">
        <View className="px-4 py-4">
          <Text className="text-3xl font-bold">{item?.Name}</Text>
          <Text className="">{item?.Overview}</Text>
        </View>
        <View className="mb-4">
          <NextUp seriesId={seriesId} />
        </View>
        <SeasonPicker item={item} />
      </View>
    </ParallaxScrollView>
  );
};

export default page;
