import { Text } from "@/components/common/Text";
import { ParallaxScrollView } from "@/components/ParallaxPage";
import { NextUp } from "@/components/series/NextUp";
import { SeasonPicker } from "@/components/series/SeasonPicker";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getLogoImageUrlById } from "@/utils/jellyfin/image/getLogoImageUrlById";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { View } from "react-native";

const page: React.FC = () => {
  const params = useLocalSearchParams();
  const { id: seriesId, seasonIndex } = params as {
    id: string;
    seasonIndex: string;
  };

  console.log("seasonIndex", seasonIndex);

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
    staleTime: 60 * 1000,
  });

  const backdropUrl = useMemo(
    () =>
      getBackdropUrl({
        api,
        item,
        quality: 90,
        width: 1000,
      }),
    [item]
  );

  const logoUrl = useMemo(
    () =>
      getLogoImageUrlById({
        api,
        item,
      }),
    [item]
  );

  if (!item || !backdropUrl) return null;

  return (
    <ParallaxScrollView
      headerHeight={300}
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
      <View className="flex flex-col pt-4">
        <View className="px-4 py-4">
          <Text className="text-3xl font-bold">{item?.Name}</Text>
          <Text className="">{item?.Overview}</Text>
        </View>
        <View className="mb-4">
          <NextUp seriesId={seriesId} />
        </View>
        <SeasonPicker item={item} initialSeasonIndex={Number(seasonIndex)} />
      </View>
    </ParallaxScrollView>
  );
};

export default page;
