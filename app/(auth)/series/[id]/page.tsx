import { Text } from "@/components/common/Text";
import MoviePoster from "@/components/MoviePoster";
import { NextUp } from "@/components/series/NextUp";
import { SeasonPicker } from "@/components/series/SeasonPicker";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImageById, getUserItemData, nextUp } from "@/utils/jellyfin";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { ScrollView, View } from "react-native";

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
    staleTime: 60,
  });

  if (!item) return null;

  return (
    <ScrollView>
      <View className="flex flex-col pt-4 pb-8">
        <View className="px-4">
          <MoviePoster item={item} />
          <View className="my-4">
            <Text className="text-3xl font-bold">{item?.Name}</Text>
            <Text className="">{item?.Overview}</Text>
          </View>
        </View>
        <SeasonPicker item={item} />
        <NextUp seriesId={seriesId} />
      </View>
    </ScrollView>
  );
};

export default page;
