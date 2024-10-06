import { Bitrate } from "@/components/BitrateSelector";
import { settingsAtom } from "@/utils/atoms/settings";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { reportPlaybackStopped } from "@/utils/jellyfin/playstate/reportPlaybackStopped";
import ios from "@/utils/profiles/ios";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client";
import { getSessionApi } from "@jellyfin/sdk/lib/utils/api";
import { useAtomValue } from "jotai";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiAtom, userAtom } from "./JellyfinProvider";

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
  setOfflineSettings: (data: PlaybackType) => void;
  playUrl?: string | null;
  reportStopPlayback: (ticks: number) => Promise<void>;
  setPlayUrl: React.Dispatch<React.SetStateAction<string | null>>;
};

const PlaySettingsContext = createContext<PlaySettingsContextType | undefined>(
  undefined
);

export const PlaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playSettings, _setPlaySettings] = useState<PlaybackType | null>(null);
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

  const setOfflineSettings = useCallback((data: PlaybackType) => {
    _setPlaySettings(data);
  }, []);

  const setPlaySettings = useCallback(
    async (
      dataOrUpdater:
        | PlaybackType
        | null
        | ((prev: PlaybackType | null) => PlaybackType | null)
    ) => {
      _setPlaySettings((prevSettings) => {
        const newSettings =
          typeof dataOrUpdater === "function"
            ? dataOrUpdater(prevSettings)
            : dataOrUpdater;

        if (!api || !user || !settings || newSettings === null) {
          return newSettings;
        }

        let deviceProfile: any = ios;
        if (settings?.deviceProfile === "Native") deviceProfile = native;
        if (settings?.deviceProfile === "Old") deviceProfile = old;

        getStreamUrl({
          api,
          deviceProfile,
          item: newSettings?.item,
          mediaSourceId: newSettings?.mediaSource?.Id,
          startTimeTicks: 0,
          maxStreamingBitrate: newSettings?.bitrate?.value,
          audioStreamIndex: newSettings?.audioIndex
            ? newSettings?.audioIndex
            : 0,
          subtitleStreamIndex: newSettings?.subtitleIndex
            ? newSettings?.subtitleIndex
            : -1,
          userId: user.Id,
          forceDirectPlay: false,
          sessionData: null,
        }).then((url) => {
          if (url) setPlayUrl(url);
        });

        return newSettings;
      });
    },
    [api, user, settings, setPlayUrl]
  );

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
      value={{
        playSettings,
        setPlaySettings,
        playUrl,
        reportStopPlayback,
        setPlayUrl,
        setOfflineSettings,
      }}
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
