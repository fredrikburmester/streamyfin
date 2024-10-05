import { ItemImage } from "@/components/common/ItemImage";
import { HourHeader } from "@/components/livetv/HourHeader";
import { LiveTVGuideRow } from "@/components/livetv/LiveTVGuideRow";
import { TAB_HEIGHT } from "@/constants/Values";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getLiveTvApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React, { useCallback, useMemo, useState } from "react";
import { Button, Dimensions, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HOUR_HEIGHT = 30;
const ITEMS_PER_PAGE = 20;

const MemoizedLiveTVGuideRow = React.memo(LiveTVGuideRow);

export default function page() {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);

  const { data: guideInfo } = useQuery({
    queryKey: ["livetv", "guideInfo"],
    queryFn: async () => {
      const res = await getLiveTvApi(api!).getGuideInfo();
      return res.data;
    },
  });

  const { data: channels } = useQuery({
    queryKey: ["livetv", "channels", currentPage],
    queryFn: async () => {
      const res = await getLiveTvApi(api!).getLiveTvChannels({
        startIndex: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
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
    queryKey: ["livetv", "programs", date, currentPage],
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

  const memoizedChannels = useMemo(() => channels?.Items || [], [channels]);

  const [scrollX, setScrollX] = useState(0);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

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
      <View className="flex flex-row  bg-neutral-800 w-full items-end">
        <Button
          title="Previous"
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        />
        <Button
          title="Next"
          onPress={handleNextPage}
          disabled={
            !channels || (channels?.Items?.length || 0) < ITEMS_PER_PAGE
          }
        />
      </View>

      <View className="flex flex-row">
        <View className="flex flex-col w-[64px]">
          <View
            style={{
              height: HOUR_HEIGHT,
            }}
            className="bg-neutral-800"
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
              <MemoizedLiveTVGuideRow
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
