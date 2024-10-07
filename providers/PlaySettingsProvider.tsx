import { Bitrate } from "@/components/BitrateSelector";
import { settingsAtom } from "@/utils/atoms/settings";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import ios from "@/utils/profiles/ios";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client";
import { getPlaystateApi, getSessionApi } from "@jellyfin/sdk/lib/utils/api";
import { useAtomValue } from "jotai";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiAtom, getOrSetDeviceId, userAtom } from "./JellyfinProvider";

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
  setPlayUrl: React.Dispatch<React.SetStateAction<string | null>>;
  playSessionId?: string | null;
  setOfflineSettings: (data: PlaybackType) => void;
};

const PlaySettingsContext = createContext<PlaySettingsContextType | undefined>(
  undefined
);

export const PlaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playSettings, _setPlaySettings] = useState<PlaybackType | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [playSessionId, setPlaySessionId] = useState<string | null>(null);

  const api = useAtomValue(apiAtom);
  const settings = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);

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
        }).then((data) => {
          setPlayUrl(data?.url!);
          setPlaySessionId(data?.sessionId!);
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
            "https://raw.githubusercontent.com/retardgerman/streamyfinweb/refs/heads/redesign/public/assets/images/icon_new_withoutBackground.png",
          PlayableMediaTypes: ["Audio", "Video"],
          SupportedCommands: ["Play"],
          SupportsMediaControl: true,
          SupportsPersistentIdentifier: true,
        },
      });
    };

    postCaps();
  }, [settings, api]);

  return (
    <PlaySettingsContext.Provider
      value={{
        playSettings,
        setPlaySettings,
        playUrl,
        setPlayUrl,
        setOfflineSettings,
        playSessionId,
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
