import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client";
import { settingsAtom } from "@/utils/atoms/settings";
import { apiAtom, userAtom } from "./JellyfinProvider";
import { useAtomValue } from "jotai";
import iosFmp4 from "@/utils/profiles/iosFmp4";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { reportPlaybackStopped } from "@/utils/jellyfin/playstate/reportPlaybackStopped";

export type PlaybackType = {
  item?: BaseItemDto | null;
  mediaSource?: MediaSourceInfo | null;
  subtitleIndex?: number | null;
  audioIndex?: number | null;
  quality?: any | null;
};

type PlaySettingsContextType = {
  playSettings: PlaybackType | null;
  setPlaySettings: React.Dispatch<React.SetStateAction<PlaybackType | null>>;
  playUrl: string | null;
  reportStopPlayback: (ticks: number) => Promise<void>;
};

const PlaySettingsContext = createContext<PlaySettingsContextType | undefined>(
  undefined
);

export const PlaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playSettings, setPlaySettings] = useState<PlaybackType | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  const api = useAtomValue(apiAtom);
  const settings = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);

  const reportStopPlayback = useCallback(
    async (ticks: number) => {
      const id = playSettings?.item?.Id;
      setPlaySettings(null);

      await reportPlaybackStopped({
        api,
        itemId: id,
        sessionId: undefined,
        positionTicks: ticks,
      });
    },
    [playSettings?.item?.Id, api]
  );

  useEffect(() => {
    const fetchPlayUrl = async () => {
      if (!api || !user || !settings) {
        setPlayUrl(null);
        return;
      }

      // Determine the device profile
      let deviceProfile: any = iosFmp4;
      if (settings?.deviceProfile === "Native") deviceProfile = native;
      if (settings?.deviceProfile === "Old") deviceProfile = old;

      const url = await getStreamUrl({
        api,
        deviceProfile,
        item: playSettings?.item,
        mediaSourceId: playSettings?.mediaSource?.Id,
        startTimeTicks: 0,
        maxStreamingBitrate: 0,
        audioStreamIndex: playSettings?.audioIndex
          ? playSettings?.audioIndex
          : 0,
        subtitleStreamIndex: playSettings?.subtitleIndex
          ? playSettings?.subtitleIndex
          : -1,
        userId: user.Id,
        forceDirectPlay: false,
        sessionData: null,
      });

      setPlayUrl(url);
    };

    fetchPlayUrl();
  }, [api, settings, user, playSettings]);

  return (
    <PlaySettingsContext.Provider
      value={{ playSettings, setPlaySettings, playUrl, reportStopPlayback }}
    >
      {children}
    </PlaySettingsContext.Provider>
  );
};

export const usePlaySettings = () => {
  const context = useContext(PlaySettingsContext);
  if (context === undefined) {
    throw new Error(
      "usePlaySettings must be used within a PlaySettingsProvider"
    );
  }
  return context;
};
