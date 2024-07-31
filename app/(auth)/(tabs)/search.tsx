import { Input } from "@/components/common/Input";
import { Text } from "@/components/common/Text";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getSearchApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

export default function search() {
  const [search, setSearch] = useState<string>("");
  const [totalResults, setTotalResults] = useState<number>(0);

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  // useEffect(() => {
  //   (async () => {
  //     if (!api || search.length === 0) return;
  //     const searchApi = await getSearchApi(api).getSearchHints({
  //       searchTerm: search,
  //       limit: 10,
  //       includeItemTypes: ["Movie"],
  //     });

  //     const data = searchApi.data;

  //     setTotalResults(data.TotalRecordCount || 0);
  //     setData(data.SearchHints || []);
  //   })();
  // }, [search]);

  const { data } = useQuery({
    queryKey: ["search", search],
    queryFn: async () => {
      if (!api || !user || search.length === 0) return [];

      const searchApi = await getSearchApi(api).getSearchHints({
        searchTerm: search,
        limit: 10,
        includeItemTypes: ["Movie"],
      });

      return searchApi.data.SearchHints;
    },
  });

  return (
    <View className="p-4">
      <View className="mb-4">
        <Input
          placeholder="Search here..."
          value={search}
          onChangeText={(text) => setSearch(text)}
        />
      </View>

      <ScrollView>
        <View className="rounded-xl overflow-hidden">
          {data?.map((item, index) => (
            <RenderItem item={item} key={index} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

type RenderItemProps = {
  item: BaseItemDto;
};

const RenderItem: React.FC<RenderItemProps> = ({ item }) => {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(auth)/items/${item.Id}/page`)}
      className="flex flex-row items-center justify-between p-4 bg-neutral-900 border-neutral-800"
    >
      <View className="flex flex-col">
        <Text className="font-bold">{item.Name}</Text>
        {item.Type === "Movie" && (
          <Text className="opacity-50">{item.ProductionYear}</Text>
        )}
      </View>
      <Ionicons name="arrow-forward" size={24} color="white" />
    </TouchableOpacity>
  );
};
