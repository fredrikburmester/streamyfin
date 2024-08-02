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
    queryKey: ["item", seriesId],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId: seriesId,
      }),
    enabled: !!seriesId && !!api,
    staleTime: Infinity,
  });

  const { data: next } = useQuery({
    queryKey: ["nextUp", seriesId],
    queryFn: async () =>
      await nextUp({
        userId: user?.Id,
        api,
        itemId: seriesId,
      }),
    enabled: !!api && !!seriesId && !!user?.Id,
    staleTime: 0,
  });

  if (!item) return null;

  return (
    <ScrollView>
      <View className="flex flex-col px-4 pt-4 pb-8">
        <MoviePoster item={item} />
        <View className="my-4">
          <Text className="text-3xl font-bold">{item?.Name}</Text>
          <Text className="">{item?.Overview}</Text>
        </View>
        <SeasonPicker item={item} />
        <NextUp items={next} />
      </View>
    </ScrollView>
  );
};

export default page;
