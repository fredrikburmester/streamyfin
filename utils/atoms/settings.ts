import { atom, useAtom } from "jotai";

type Settings = {
  autoRotate?: boolean;
  forceLandscapeInVideoPlayer?: boolean;
  openFullScreenVideoPlayerByDefault?: boolean;
  usePopularPlugin?: boolean;
  deviceProfile?: "Expo" | "Native" | "Old";
  forceDirectPlay?: boolean;
  mediaListCollectionIds?: string[];
};

// Default settings
const defaultSettings: Settings = {
  autoRotate: true,
  forceLandscapeInVideoPlayer: false,
  openFullScreenVideoPlayerByDefault: true,
  usePopularPlugin: false,
  deviceProfile: "Expo",
  forceDirectPlay: false,
  mediaListCollectionIds: [],
};

// Create an atom to store the settings in memory, initialized with default settings
const settingsAtom = atom<Settings>(defaultSettings);

// A hook to manage settings, providing a way to update them
export const useSettings = () => {
  const [settings, setSettings] = useAtom(settingsAtom);

  const updateSettings = (update: Partial<Settings>) => {
    const newSettings = { ...settings, ...update };
    setSettings(newSettings);
  };

  return [settings, updateSettings] as const;
};
