import { ItemImage } from "@/components/common/ItemImage";
import { Text } from "@/components/common/Text";
import { HourHeader } from "@/components/livetv/HourHeader";
import { LiveTVGuideRow } from "@/components/livetv/LiveTVGuideRow";
import { TAB_HEIGHT } from "@/constants/Values";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
} from "@jellyfin/sdk/lib/generated-client";
import { getLiveTvApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HOUR_HEIGHT = 30;

export default function page() {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState<Date>(new Date());

  const { data: guideInfo } = useQuery({
    queryKey: ["livetv", "guideInfo"],
    queryFn: async () => {
      const res = await getLiveTvApi(api!).getGuideInfo();
      return res.data;
    },
  });
  const { data: channels } = useQuery({
    queryKey: ["livetv", "channels"],
    queryFn: async () => {
      const res = await getLiveTvApi(api!).getLiveTvChannels({
        startIndex: 0,
        limit: 500,
        enableFavoriteSorting: true,
        userId: user?.Id,
        addCurrentProgram: false,
        enableUserData: false,
        enableImageTypes: ["Primary"],
      });
      return res.data;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ["livetv", "programs", date],
    queryFn: async () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const now = new Date();
      const isToday = startOfDay.toDateString() === now.toDateString();

      const res = await getLiveTvApi(api!).getPrograms({
        getProgramsDto: {
          MaxStartDate: endOfDay.toISOString(),
          MinEndDate: isToday ? now.toISOString() : startOfDay.toISOString(),
          ChannelIds: channels?.Items?.map((c) => c.Id).filter(
            Boolean
          ) as string[],
          ImageTypeLimit: 1,
          EnableImages: false,
          SortBy: ["StartDate"],
          EnableTotalRecordCount: false,
          EnableUserData: false,
        },
      });
      return res.data;
    },
    enabled: !!channels,
  });

  const screenWidth = Dimensions.get("window").width;

  const [scrollX, setScrollX] = useState(0);

  return (
    <ScrollView
      nestedScrollEnabled
      contentInsetAdjustmentBehavior="automatic"
      key={"home"}
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: 16,
      }}
      style={{
        marginBottom: TAB_HEIGHT,
      }}
    >
      <View className="flex flex-row">
        <View className="flex flex-col w-[64px]">
          <View
            style={{
              height: HOUR_HEIGHT,
            }}
          ></View>
          {channels?.Items?.map((c, i) => (
            <View className="h-16 w-16 mr-4 rounded-lg overflow-hidden" key={i}>
              <ItemImage
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "contain",
                }}
                item={c}
              />
            </View>
          ))}
        </View>
        <ScrollView
          style={{
            width: screenWidth - 64,
          }}
          horizontal
          scrollEnabled
          onScroll={(e) => {
            setScrollX(e.nativeEvent.contentOffset.x);
          }}
        >
          <View className="flex flex-col">
            <HourHeader height={HOUR_HEIGHT} />
            {channels?.Items?.map((c, i) => (
              <LiveTVGuideRow
                channel={c}
                programs={programs?.Items}
                key={c.Id}
                scrollX={scrollX}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}
