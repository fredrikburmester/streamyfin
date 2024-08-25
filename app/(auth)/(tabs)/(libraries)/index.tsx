import { Text } from "@/components/common/Text";
import { LibraryItemCard } from "@/components/library/LibraryItemCard";
import { Loader } from "@/components/Loader";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import {
  getUserLibraryApi,
  getUserViewsApi,
} from "@jellyfin/sdk/lib/utils/api";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "expo-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

export default function index() {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();
  const [settings] = useSettings();

  const { data, isLoading: isLoading } = useQuery({
    queryKey: ["user-views", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) {
        return null;
      }

      const response = await getUserViewsApi(api).getUserViews({
        userId: user.Id,
      });

      return response.data.Items || null;
    },
    enabled: !!api && !!user?.Id,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    for (const item of data || []) {
      queryClient.prefetchQuery({
        queryKey: ["library", item.Id],
        queryFn: async () => {
          if (!item.Id || !user?.Id || !api) return null;
          const response = await getUserLibraryApi(api).getItem({
            itemId: item.Id,
            userId: user?.Id,
          });
          return response.data;
        },
        staleTime: 60 * 1000,
      });
    }
  }, [data]);

  if (isLoading)
    return (
      <View className="justify-center items-center h-full">
        <Loader />
      </View>
    );

  if (!data)
    return (
      <View className="h-full w-full flex justify-center items-center">
        <Text className="text-lg text-neutral-500">No libraries found</Text>
      </View>
    );

  return (
    <FlashList
      extraData={settings}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingTop: 17,
        paddingHorizontal: settings?.libraryOptions?.display === "row" ? 0 : 17,
        paddingBottom: 150,
      }}
      data={data}
      renderItem={({ item }) => <LibraryItemCard library={item} />}
      keyExtractor={(item) => item.Id || ""}
      ItemSeparatorComponent={() =>
        settings?.libraryOptions?.display === "row" ? (
          <View
            style={{
              height: StyleSheet.hairlineWidth,
            }}
            className="bg-neutral-800 mx-2 my-4"
          ></View>
        ) : (
          <View className="h-4" />
        )
      }
      estimatedItemSize={200}
    />
  );
}
