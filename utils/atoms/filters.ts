import {
  ItemFilter,
  ItemSortBy,
  NameGuidPair,
  SortOrder,
} from "@jellyfin/sdk/lib/generated-client/models";
import { atom, useAtom } from "jotai";

export const sortOptions: {
  key: ItemSortBy;
  value: string;
}[] = [
  { key: "SortName", value: "Name" },
  { key: "CommunityRating", value: "Community Rating" },
  { key: "CriticRating", value: "Critics Rating" },
  { key: "DateLastContentAdded", value: "Content Added" },
  { key: "DatePlayed", value: "Date Played" },
  { key: "PlayCount", value: "Play Count" },
  { key: "ProductionYear", value: "Production Year" },
  { key: "Runtime", value: "Runtime" },
  { key: "OfficialRating", value: "Official Rating" },
  { key: "PremiereDate", value: "Premiere Date" },
  { key: "StartDate", value: "Start Date" },
  { key: "IsUnplayed", value: "Is Unplayed" },
  { key: "IsPlayed", value: "Is Played" },
  { key: "VideoBitRate", value: "Video Bit Rate" },
  { key: "AirTime", value: "Air Time" },
  { key: "Studio", value: "Studio" },
  { key: "IsFavoriteOrLiked", value: "Is Favorite Or Liked" },
  { key: "Random", value: "Random" },
];

export const sortOrderOptions: {
  key: SortOrder;
  value: string;
}[] = [
  { key: "Ascending", value: "Ascending" },
  { key: "Descending", value: "Descending" },
];

export const genreFilterAtom = atom<string[]>([]);
export const tagsFilterAtom = atom<string[]>([]);
export const yearFilterAtom = atom<string[]>([]);
export const sortByAtom = atom<(typeof sortOptions)[number]>(sortOptions[0]);
export const sortOrderAtom = atom<(typeof sortOrderOptions)[number]>(
  sortOrderOptions[0],
);
