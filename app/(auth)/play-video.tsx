import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { Api } from "@jellyfin/sdk";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { useRouter } from "expo-router";
import { atom, useAtom } from "jotai";
import { useMemo, useRef, useState } from "react";
import Video, { VideoRef } from "react-native-video";

type PlaybackType = {
  item: BaseItemDto;
  mediaSourceId: string;
  subtitleIndex: number;
  audioIndex: number;
  url: string;
  quality: any;
};

export const playInfoAtom = atom<PlaybackType | null>(null);

export default function page() {
  const [playInfo, setPlayInfo] = useAtom(playInfoAtom);
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [settings] = useSettings();
  const router = useRouter();
  const videoRef = useRef<VideoRef | null>(null);
  const poster = usePoster(playInfo, api);
  const videoSource = useVideoSource(playInfo, api, poster);

  const [ignoreSafeArea, setIgnoreSafeArea] = useState(false);

  if (!playInfo || !api || !videoSource) return null;

  return (
    <Video
      ref={videoRef}
      source={videoSource}
      style={{ width: "100%", height: "100%" }}
      resizeMode={ignoreSafeArea ? "cover" : "contain"}
      onProgress={handleVideoProgress}
      onLoad={(data) => (max.value = secondsToTicks(data.duration))}
      onError={handleVideoError}
      playWhenInactive={true}
      allowsExternalPlayback={true}
      playInBackground={true}
      pictureInPicture={true}
      showNotificationControls={true}
      ignoreSilentSwitch="ignore"
      fullscreen={false}
    />
  );
}

export function usePoster(
  playInfo: PlaybackType | null,
  api: Api | null
): string | undefined {
  const poster = useMemo(() => {
    if (!playInfo?.item || !api) return undefined;
    return playInfo.item.Type === "Audio"
      ? `${api.basePath}/Items/${playInfo.item.AlbumId}/Images/Primary?tag=${playInfo.item.AlbumPrimaryImageTag}&quality=90&maxHeight=200&maxWidth=200`
      : getBackdropUrl({
          api,
          item: playInfo.item,
          quality: 70,
          width: 200,
        });
  }, [playInfo?.item, api]);

  return poster ?? undefined;
}

export function useVideoSource(
  playInfo: PlaybackType | null,
  api: Api | null,
  poster: string | undefined
) {
  const videoSource = useMemo(() => {
    if (!playInfo || !api) return null;

    const startPosition = playInfo.item?.UserData?.PlaybackPositionTicks
      ? Math.round(playInfo.item.UserData.PlaybackPositionTicks / 10000)
      : 0;

    return {
      uri: playInfo.url,
      isNetwork: true,
      startPosition,
      headers: getAuthHeaders(api),
      metadata: {
        artist: playInfo.item?.AlbumArtist ?? undefined,
        title: playInfo.item?.Name || "Unknown",
        description: playInfo.item?.Overview ?? undefined,
        imageUri: poster,
        subtitle: playInfo.item?.Album ?? undefined,
      },
    };
  }, [playInfo, api, poster]);

  return videoSource;
}
