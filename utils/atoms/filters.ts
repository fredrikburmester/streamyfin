import { NameGuidPair } from "@jellyfin/sdk/lib/generated-client/models";
import { atom, useAtom } from "jotai";

export const genreFilterAtom = atom<string[]>([]);
export const tagsFilterAtom = atom<string[]>([]);
export const yearFilterAtom = atom<string[]>([]);
export const sortByAtom = atom<string>("title");
