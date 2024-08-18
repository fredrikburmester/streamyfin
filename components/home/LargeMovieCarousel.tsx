import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getLogoImageUrlById } from "@/utils/jellyfin/image/getLogoImageUrlById";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useMemo } from "react";
import { Dimensions, View, ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { TouchableItemRouter } from "../common/TouchableItemRouter";
import { Loader } from "../Loader";

interface Props extends ViewProps {}

export const LargeMovieCarousel: React.FC<Props> = ({ ...props }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [settings] = useSettings();

  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  const { data: mediaListCollection, isLoading: l1 } = useQuery<string | null>({
    queryKey: ["mediaListCollection", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) return null;

      const response = await getItemsApi(api).getItems({
        userId: user.Id,
        tags: ["medialist", "promoted"],
        recursive: true,
        fields: ["Tags"],
        includeItemTypes: ["BoxSet"],
      });

      const id = response.data.Items?.find((c) => c.Name === "sf_carousel")?.Id;
      return id || null;
    },
    enabled: !!api && !!user?.Id && settings?.usePopularPlugin === true,
    staleTime: 0,
  });

  const { data: popularItems, isLoading: l2 } = useQuery<BaseItemDto[]>({
    queryKey: ["popular", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id || !mediaListCollection) return [];

      const response = await getItemsApi(api).getItems({
        userId: user.Id,
        parentId: mediaListCollection,
        limit: 10,
      });

      return response.data.Items || [];
    },
    enabled: !!api && !!user?.Id && !!mediaListCollection,
    staleTime: 0,
  });

  const width = Dimensions.get("screen").width;

  if (l1 || l2)
    return (
      <View className="h-[242px] flex items-center justify-center">
        <Loader />
      </View>
    );

  if (!popularItems) return null;

  return (
    <View className="flex flex-col items-center" {...props}>
      <Carousel
        autoPlay={true}
        autoPlayInterval={2000}
        loop={true}
        ref={ref}
        width={width}
        height={204}
        data={popularItems}
        onProgressChange={progress}
        renderItem={({ item, index }) => <RenderItem item={item} />}
      />
      <Pagination.Basic
        progress={progress}
        data={popularItems}
        dotStyle={{
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: 50,
        }}
        activeDotStyle={{
          backgroundColor: "rgba(255,255,255,0.8)",
          borderRadius: 50,
        }}
        containerStyle={{ gap: 5, marginTop: 12 }}
        onPress={onPressPagination}
      />
    </View>
  );
};

const RenderItem: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const [api] = useAtom(apiAtom);

  const uri = useMemo(() => {
    if (!api) return null;

    return getBackdropUrl({
      api,
      item,
      quality: 90,
      width: 1000,
    });
  }, [api, item]);

  const logoUri = useMemo(() => {
    if (!api) return null;
    return getLogoImageUrlById({ api, item, height: 100 });
  }, [item]);

  if (!uri || !logoUri) return null;

  return (
    <TouchableItemRouter item={item}>
      <View className="px-4">
        <View className="relative flex justify-center rounded-2xl overflow-hidden border border-neutral-800">
          <Image
            source={{
              uri,
            }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 16,
              overflow: "hidden",
            }}
          />
          <View className="absolute bottom-0 left-0 w-full h-24 p-4 flex items-center">
            <Image
              source={{
                uri: logoUri,
              }}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: "contain",
              }}
            />
          </View>
        </View>
      </View>
    </TouchableItemRouter>
  );
};
