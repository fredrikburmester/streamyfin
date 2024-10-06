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
import { Bitrate } from "@/components/BitrateSelector";
import ios from "@/utils/profiles/ios";
import { getSessionApi } from "@jellyfin/sdk/lib/utils/api";

export type PlaybackType = {
  item?: BaseItemDto | null;
  mediaSource?: MediaSourceInfo | null;
  subtitleIndex?: number | null;
  audioIndex?: number | null;
  bitrate?: Bitrate | null;
};

type PlaySettingsContextType = {
  playSettings: PlaybackType | null;
  setPlaySettings: React.Dispatch<React.SetStateAction<PlaybackType | null>>;
  playUrl?: string | null;
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
      if (!api || !user || !settings || !playSettings) {
        console.log("fetchPlayUrl ~ missing params");
        setPlayUrl(null);
        return;
      }

      console.log("fetchPlayUrl ~ fetching url", playSettings?.item?.Id);

      // Determine the device profile
      let deviceProfile: any = ios;
      if (settings?.deviceProfile === "Native") deviceProfile = native;
      if (settings?.deviceProfile === "Old") deviceProfile = old;

      const url = await getStreamUrl({
        api,
        deviceProfile,
        item: playSettings?.item,
        mediaSourceId: playSettings?.mediaSource?.Id,
        startTimeTicks: 0,
        maxStreamingBitrate: playSettings?.bitrate?.value,
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

  useEffect(() => {
    let deviceProfile: any = ios;
    if (settings?.deviceProfile === "Native") deviceProfile = native;
    if (settings?.deviceProfile === "Old") deviceProfile = old;

    const postCaps = async () => {
      if (!api) return;
      await getSessionApi(api).postFullCapabilities({
        clientCapabilitiesDto: {
          AppStoreUrl: "https://apps.apple.com/us/app/streamyfin/id6593660679",
          DeviceProfile: deviceProfile,
          IconUrl:
            "https://github.com/fredrikburmester/streamyfin/blob/master/assets/images/adaptive_icon.png",
          PlayableMediaTypes: ["Audio", "Video"],
          SupportedCommands: ["Play"],
          SupportsMediaControl: true,
          SupportsPersistentIdentifier: true,
        },
      });
    };

    postCaps();
  }, [settings]);

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
