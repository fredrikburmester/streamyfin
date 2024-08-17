import { Text } from "@/components/common/Text";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "@/utils/atoms/settings";
import { FlashList } from "@shopify/flash-list";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function index() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [loading, setLoading] = useState(false);
  const [settings, _] = useSettings();

  const { data, isLoading: isLoading } = useQuery({
    queryKey: ["collections", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) {
        return [];
      }

      const data = (
        await getItemsApi(api).getItems({
          userId: user.Id,
          sortBy: ["SortName", "DateCreated"],
        })
      ).data;

      return data.Items || [];
    },
    enabled: !!api && !!user?.Id,
    staleTime: 60 * 1000,
  });

  if (isLoading)
    return (
      <View className="justify-center items-center h-full">
        <ActivityIndicator />
      </View>
    );

  return (
    <FlashList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingTop: 17,
        paddingHorizontal: 17,
        paddingBottom: 150,
      }}
      data={data}
      renderItem={({ item }) => <CollectionCard collection={item} />}
      keyExtractor={(item) => item.Id || ""}
      ItemSeparatorComponent={() => <View className="h-4" />}
      estimatedItemSize={200}
    />
  );
}

interface Props {
  collection: BaseItemDto;
}

const CollectionCard: React.FC<Props> = ({ collection }) => {
  const router = useRouter();

  const [api] = useAtom(apiAtom);

  const url = useMemo(
    () =>
      getPrimaryImageUrl({
        api,
        item: collection,
      }),
    [collection],
  );

  if (!url) return null;

  return (
    <TouchableOpacity
      onPress={() => {
        router.push(`/library/collections/${collection.Id}`);
      }}
    >
      <View className="flex items-center justify-center rounded-xl w-full aspect-video relative border border-neutral-900">
        <Image
          source={{ uri: url }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 8,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        <Text className="font-bold text-2xl">{collection.Name}</Text>
      </View>
    </TouchableOpacity>
  );
};
