import { useRemuxHlsToMp4 } from "@/hooks/useRemuxHlsToMp4";
import { useDownload } from "@/providers/DownloadProvider";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { queueActions, queueAtom } from "@/utils/atoms/queue";
import { useSettings } from "@/utils/atoms/settings";
import { getDefaultPlaySettings } from "@/utils/jellyfin/getDefaultPlaySettings";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { saveDownloadItemInfoToDiskTmp } from "@/utils/optimize-server";
import download from "@/utils/profiles/download";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client/models";
import { Href, router, useFocusEffect } from "expo-router";
import { useAtom } from "jotai";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, TouchableOpacity, View, ViewProps } from "react-native";
import { toast } from "sonner-native";
import { AudioTrackSelector } from "./AudioTrackSelector";
import { Bitrate, BitrateSelector } from "./BitrateSelector";
import { Button } from "./Button";
import { Text } from "./common/Text";
import { Loader } from "./Loader";
import { MediaSourceSelector } from "./MediaSourceSelector";
import ProgressCircle from "./ProgressCircle";
import { SubtitleTrackSelector } from "./SubtitleTrackSelector";

interface DownloadProps extends ViewProps {
  items: BaseItemDto[];
  MissingDownloadIconComponent: () => React.ReactElement;
  DownloadedIconComponent: () => React.ReactElement;
}

export const DownloadItems: React.FC<DownloadProps> = ({
  items,
  MissingDownloadIconComponent,
  DownloadedIconComponent,
  ...props
}) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [queue, setQueue] = useAtom(queueAtom);
  const [settings] = useSettings();
  const { processes, startBackgroundDownload, downloadedFiles } = useDownload();
  const { startRemuxing } = useRemuxHlsToMp4();

  const [selectedMediaSource, setSelectedMediaSource] = useState<
    MediaSourceInfo | undefined | null
  >(undefined);
  const [selectedAudioStream, setSelectedAudioStream] = useState<number>(-1);
  const [selectedSubtitleStream, setSelectedSubtitleStream] =
    useState<number>(0);
  const [maxBitrate, setMaxBitrate] = useState<Bitrate>({
    key: "Max",
    value: undefined,
  });

  const userCanDownload = useMemo(
    () => user?.Policy?.EnableContentDownloading,
    [user]
  );
  const usingOptimizedServer = useMemo(
    () => settings?.downloadMethod === "optimized",
    [settings]
  );

  /**
   * Bottom sheet
   */
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {}, []);

  const closeModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  // region computed
  const itemIds = useMemo(() => items.map((i) => i.Id), [items]);
  const pendingItems = useMemo(
    () =>
      items.filter((i) => !downloadedFiles?.some((f) => f.item.Id === i.Id)),
    [items, downloadedFiles]
  );
  const isDownloaded = useMemo(() => {
    if (!downloadedFiles) return false;
    return pendingItems.length == 0;
  }, [downloadedFiles, pendingItems]);

  const itemsProcesses = useMemo(
    () => processes?.filter((p) => itemIds.includes(p.item.Id)),
    [processes, itemIds]
  );

  const progress = useMemo(() => {
    if (itemIds.length == 1)
      return itemsProcesses.reduce((acc, p) => acc + p.progress, 0);
    return (
      ((itemIds.length -
        queue.filter((q) => itemIds.includes(q.item.Id)).length) /
        itemIds.length) *
      100
    );
  }, [queue, itemsProcesses, itemIds]);

  const itemsQueued = useMemo(() => {
    return (
      pendingItems.length > 0 &&
      pendingItems.every((p) => queue.some((q) => p.Id == q.item.Id))
    );
  }, [queue, pendingItems]);
  // endregion computed

  // region helper functions
  const navigateToDownloads = () => router.push("/downloads");

  const onDownloadedPress = () => {
    const firstItem = items?.[0];
    router.push(
      firstItem.Type !== "Episode"
        ? "/downloads"
        : ({
            pathname: `/downloads/${firstItem.SeriesId}`,
            params: {
              episodeSeasonIndex: firstItem.ParentIndexNumber,
            },
          } as Href)
    );
  };

  const acceptDownloadOptions = useCallback(() => {
    if (userCanDownload === true) {
      if (pendingItems.some((i) => !i.Id)) {
        throw new Error("No item id");
      }
      closeModal();

      if (usingOptimizedServer) initiateDownload(...pendingItems);
      else {
        queueActions.enqueue(
          queue,
          setQueue,
          ...pendingItems.map((item) => ({
            id: item.Id!,
            execute: async () => await initiateDownload(item),
            item,
          }))
        );
      }
    } else {
      toast.error("You are not allowed to download files.");
    }
  }, [
    queue,
    setQueue,
    pendingItems,
    usingOptimizedServer,
    userCanDownload,

    // Need to be reference at the time async lambda is created for initiateDownload
    maxBitrate,
    selectedMediaSource,
    selectedAudioStream,
    selectedSubtitleStream,
  ]);

  /**
   * Start download
   */
  const initiateDownload = useCallback(
    async (...items: BaseItemDto[]) => {
      if (
        !api ||
        !user?.Id ||
        items.some((p) => !p.Id) ||
        (pendingItems.length === 1 && !selectedMediaSource?.Id)
      ) {
        throw new Error(
          "DownloadItem ~ initiateDownload: No api or user or item"
        );
      }
      let mediaSource = selectedMediaSource;
      let audioIndex: number | undefined = selectedAudioStream;
      let subtitleIndex: number | undefined = selectedSubtitleStream;

      for (const item of items) {
        if (pendingItems.length > 1) {
          ({ mediaSource, audioIndex, subtitleIndex } = getDefaultPlaySettings(
            item,
            settings!
          ));
        }

        const res = await getStreamUrl({
          api,
          item,
          startTimeTicks: 0,
          userId: user?.Id,
          audioStreamIndex: audioIndex,
          maxStreamingBitrate: maxBitrate.value,
          mediaSourceId: mediaSource?.Id,
          subtitleStreamIndex: subtitleIndex,
          deviceProfile: download,
        });

        if (!res) {
          Alert.alert(
            "Something went wrong",
            "Could not get stream url from Jellyfin"
          );
          continue;
        }

        const { mediaSource: source, url } = res;

        if (!url || !source) throw new Error("No url");

        saveDownloadItemInfoToDiskTmp(item, source, url);

        if (usingOptimizedServer) {
          await startBackgroundDownload(url, item, source);
        } else {
          await startRemuxing(item, url);
        }
      }
    },
    [
      api,
      user?.Id,
      pendingItems,
      selectedMediaSource,
      selectedAudioStream,
      selectedSubtitleStream,
      settings,
      maxBitrate,
      usingOptimizedServer,
      startBackgroundDownload,
      startRemuxing,
    ]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );
  // endregion helper functions

  // Allow to select & set settings for single download
  useFocusEffect(
    useCallback(() => {
      if (!settings) return;
      if (pendingItems.length !== 1) return;
      const { bitrate, mediaSource, audioIndex, subtitleIndex } =
        getDefaultPlaySettings(items[0], settings);

      // 4. Set states
      setSelectedMediaSource(mediaSource ?? undefined);
      setSelectedAudioStream(audioIndex ?? 0);
      setSelectedSubtitleStream(subtitleIndex ?? -1);
      setMaxBitrate(bitrate);
    }, [items, pendingItems, settings])
  );

  return (
    <View
      className="bg-neutral-800/80 rounded-full h-9 w-9 flex items-center justify-center"
      {...props}
    >
      {processes && itemsProcesses.length > 0 ? (
        <TouchableOpacity onPress={navigateToDownloads}>
          {progress === 0 ? (
            <Loader />
          ) : (
            <View className="-rotate-45">
              <ProgressCircle
                size={24}
                fill={progress}
                width={4}
                tintColor="#9334E9"
                backgroundColor="#bdc3c7"
              />
            </View>
          )}
        </TouchableOpacity>
      ) : itemsQueued ? (
        <TouchableOpacity onPress={navigateToDownloads}>
          <Ionicons name="hourglass" size={24} color="white" />
        </TouchableOpacity>
      ) : isDownloaded ? (
        <TouchableOpacity onPress={onDownloadedPress}>
          {DownloadedIconComponent()}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handlePresentModalPress}>
          {MissingDownloadIconComponent()}
        </TouchableOpacity>
      )}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        enableDynamicSizing
        handleIndicatorStyle={{
          backgroundColor: "white",
        }}
        backgroundStyle={{
          backgroundColor: "#171717",
        }}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView>
          <View className="flex flex-col space-y-4 px-4 pb-8 pt-2">
            <Text className="font-bold text-2xl text-neutral-10">
              Download options
            </Text>
            <View className="flex flex-col space-y-2 w-full items-start">
              <BitrateSelector
                inverted
                onChange={setMaxBitrate}
                selected={maxBitrate}
              />
              {pendingItems.length === 1 && (
                <>
                  <MediaSourceSelector
                    item={items[0]}
                    onChange={setSelectedMediaSource}
                    selected={selectedMediaSource}
                  />
                  {selectedMediaSource && (
                    <View className="flex flex-col space-y-2">
                      <AudioTrackSelector
                        source={selectedMediaSource}
                        onChange={setSelectedAudioStream}
                        selected={selectedAudioStream}
                      />
                      <SubtitleTrackSelector
                        source={selectedMediaSource}
                        onChange={setSelectedSubtitleStream}
                        selected={selectedSubtitleStream}
                      />
                    </View>
                  )}
                </>
              )}
            </View>
            <Button
              className="mt-auto"
              onPress={acceptDownloadOptions}
              color="purple"
            >
              Download
            </Button>
            <View className="opacity-70 text-center w-full flex items-center">
              <Text className="text-xs">
                {usingOptimizedServer
                  ? "Using optimized server"
                  : "Using default method"}
              </Text>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

export const DownloadSingleItem: React.FC<{ item: BaseItemDto }> = ({
  item,
}) => {
  return (
    <DownloadItems
      items={[item]}
      MissingDownloadIconComponent={() => (
        <Ionicons name="cloud-download-outline" size={24} color="white" />
      )}
      DownloadedIconComponent={() => (
        <Ionicons name="cloud-download" size={26} color="#9333ea" />
      )}
    />
  );
};
