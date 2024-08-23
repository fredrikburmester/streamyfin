import { Text } from "@/components/common/Text";
import { TouchableItemRouter } from "@/components/common/TouchableItemRouter";
import { Loader } from "@/components/Loader";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";

export default function index() {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

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

  if (isLoading)
    return (
      <View className="justify-center items-center h-full">
        <Loader />
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
      renderItem={({ item }) => <LibraryItemCard library={item} />}
      keyExtractor={(item) => item.Id || ""}
      ItemSeparatorComponent={() => <View className="h-4" />}
      estimatedItemSize={200}
    />
  );
}

interface Props {
  library: BaseItemDto;
}

const LibraryItemCard: React.FC<Props> = ({ library }) => {
  const [api] = useAtom(apiAtom);

  const url = useMemo(
    () =>
      getPrimaryImageUrl({
        api,
        item: library,
      }),
    [library]
  );

  if (!url) return null;

  return (
    <TouchableItemRouter item={library}>
      <View className="flex justify-center rounded-xl w-full relative border border-neutral-900 h-20 ">
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
        <Text className="font-bold text-xl text-start px-4">
          {library.Name}
        </Text>
      </View>
    </TouchableItemRouter>
  );
};
