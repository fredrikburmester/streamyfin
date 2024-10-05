import { Text } from "@/components/common/Text";
import { ScrollingCollectionList } from "@/components/home/ScrollingCollectionList";
import { TAB_HEIGHT } from "@/constants/Values";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { getLiveTvApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React from "react";
import {
  RefreshControl,
  ScrollView,
  SectionListComponent,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function page() {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      nestedScrollEnabled
      contentInsetAdjustmentBehavior="automatic"
      key={"home"}
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: 16,
        paddingTop: 8,
      }}
      style={{
        marginBottom: TAB_HEIGHT,
      }}
    >
      <View className="flex flex-col space-y-2">
        <ScrollingCollectionList
          queryKey={["livetv", "recommended"]}
          title={"On now"}
          queryFn={async () => {
            if (!api) return [] as BaseItemDto[];
            const res = await getLiveTvApi(api).getRecommendedPrograms({
              userId: user?.Id,
              isAiring: true,
              limit: 24,
              imageTypeLimit: 1,
              enableImageTypes: ["Primary", "Thumb", "Backdrop"],
              enableTotalRecordCount: false,
              fields: ["ChannelInfo", "PrimaryImageAspectRatio"],
            });
            return res.data.Items || [];
          }}
          orientation="horizontal"
        />
        <ScrollingCollectionList
          queryKey={["livetv", "shows"]}
          title={"Shows"}
          queryFn={async () => {
            if (!api) return [] as BaseItemDto[];
            const res = await getLiveTvApi(api).getLiveTvPrograms({
              userId: user?.Id,
              hasAired: false,
              limit: 9,
              isMovie: false,
              isSeries: true,
              isSports: false,
              isNews: false,
              isKids: false,
              enableTotalRecordCount: false,
              fields: ["ChannelInfo", "PrimaryImageAspectRatio"],
              enableImageTypes: ["Primary", "Thumb", "Backdrop"],
            });
            return res.data.Items || [];
          }}
          orientation="horizontal"
        />
        <ScrollingCollectionList
          queryKey={["livetv", "movies"]}
          title={"Movies"}
          queryFn={async () => {
            if (!api) return [] as BaseItemDto[];
            const res = await getLiveTvApi(api).getLiveTvPrograms({
              userId: user?.Id,
              hasAired: false,
              limit: 9,
              isMovie: true,
              enableTotalRecordCount: false,
              fields: ["ChannelInfo"],
              enableImageTypes: ["Primary", "Thumb", "Backdrop"],
            });
            return res.data.Items || [];
          }}
          orientation="horizontal"
        />
        <ScrollingCollectionList
          queryKey={["livetv", "sports"]}
          title={"Sports"}
          queryFn={async () => {
            if (!api) return [] as BaseItemDto[];
            const res = await getLiveTvApi(api).getLiveTvPrograms({
              userId: user?.Id,
              hasAired: false,
              limit: 9,
              isSports: true,
              enableTotalRecordCount: false,
              fields: ["ChannelInfo"],
              enableImageTypes: ["Primary", "Thumb", "Backdrop"],
            });
            return res.data.Items || [];
          }}
          orientation="horizontal"
        />
        <ScrollingCollectionList
          queryKey={["livetv", "kids"]}
          title={"For Kids"}
          queryFn={async () => {
            if (!api) return [] as BaseItemDto[];
            const res = await getLiveTvApi(api).getLiveTvPrograms({
              userId: user?.Id,
              hasAired: false,
              limit: 9,
              isKids: true,
              enableTotalRecordCount: false,
              fields: ["ChannelInfo"],
              enableImageTypes: ["Primary", "Thumb", "Backdrop"],
            });
            return res.data.Items || [];
          }}
          orientation="horizontal"
        />
        <ScrollingCollectionList
          queryKey={["livetv", "news"]}
          title={"News"}
          queryFn={async () => {
            if (!api) return [] as BaseItemDto[];
            const res = await getLiveTvApi(api).getLiveTvPrograms({
              userId: user?.Id,
              hasAired: false,
              limit: 9,
              isNews: true,
              enableTotalRecordCount: false,
              fields: ["ChannelInfo"],
              enableImageTypes: ["Primary", "Thumb", "Backdrop"],
            });
            return res.data.Items || [];
          }}
          orientation="horizontal"
        />
      </View>
    </ScrollView>
  );
}
