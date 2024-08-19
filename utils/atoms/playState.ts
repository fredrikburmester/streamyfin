import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { atom } from "jotai";

export const playingAtom = atom(false);
export const fullScreenAtom = atom(false);
export const showCurrentlyPlayingBarAtom = atom(false);
export const currentlyPlayingItemAtom = atom<{
  item: BaseItemDto;
  playbackUrl: string;
} | null>(null);
