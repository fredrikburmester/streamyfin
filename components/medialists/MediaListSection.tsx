import { View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import settings from "@/app/(auth)/settings";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollingCollectionList } from "../home/ScrollingCollectionList";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useState } from "react";

interface Props extends ViewProps {
  collection: BaseItemDto;
}

export const MediaListSection: React.FC<Props> = ({ collection, ...props }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [loading, setLoading] = useState(false);
  const [settings, _] = useSettings();

  const { data: popularItems, isLoading: isLoadingPopular } = useQuery<
    BaseItemDto[]
  >({
    queryKey: ["popular", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id || !collection.Id) return [];

      const response = await getItemsApi(api).getItems({
        userId: user.Id,
        parentId: collection.Id,
        limit: 10,
      });

      return response.data.Items || [];
    },
    enabled: !!api && !!user?.Id && !!collection.Id,
    staleTime: 0,
  });

  return (
    <ScrollingCollectionList
      title={collection.Name || ""}
      data={popularItems}
      loading={isLoadingPopular}
      disabled={!collection.Id}
      {...props}
    />
  );
};
