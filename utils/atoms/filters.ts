import {
  ItemFilter,
  ItemSortBy,
  NameGuidPair,
  SortOrder,
} from "@jellyfin/sdk/lib/generated-client/models";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const sortByOptions: {
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

// Define the keys for our preferences
type PreferenceKey =
  | "genreFilter"
  | "tagsFilter"
  | "yearFilter"
  | "sortBy"
  | "sortOrder";

// Define the type for a single collection's preferences
type CollectionPreference = {
  genreFilter: string[];
  tagsFilter: string[];
  yearFilter: string[];
  sortBy: [typeof sortByOptions][number];
  sortOrder: [typeof sortOrderOptions][number];
};

// Define the type for all sort preferences
type SortPreference = {
  [collectionId: string]: CollectionPreference;
};

// Create a base atom with storage
const baseSortPreferenceAtom = atomWithStorage<SortPreference>(
  "sortPreferences",
  {}
);

// Create a derived atom with logging
export const sortPreferenceAtom = atom(
  (get) => {
    const value = get(baseSortPreferenceAtom);
    console.log("Getting sortPreferences:", value);
    return value;
  },
  (get, set, newValue: SortPreference) => {
    console.log("Setting sortPreferences:", newValue);
    set(baseSortPreferenceAtom, newValue);
  }
);

export const currentCollectionIdAtom = atomWithStorage<string | null>(
  "currentCollectionId",
  null
);

// Helper function to create an atom with custom getter and setter
const createFilterAtom = <T extends CollectionPreference[PreferenceKey]>(
  key: PreferenceKey,
  initialValue: T
) => {
  const baseAtom = atom<T>(initialValue);

  return atom(
    (get): T => {
      const preferences = get(sortPreferenceAtom);
      const currentCollectionId = get(currentCollectionIdAtom);
      if (currentCollectionId && preferences[currentCollectionId]) {
        const preferenceValue = preferences[currentCollectionId][key];

        // Ensure the returned value matches the expected type T
        if (Array.isArray(initialValue) && Array.isArray(preferenceValue)) {
          return preferenceValue as T;
        } else if (
          typeof initialValue === "object" &&
          typeof preferenceValue === "object"
        ) {
          return preferenceValue as T;
        } else if (typeof initialValue === typeof preferenceValue) {
          return preferenceValue as T;
        }
      }
      return get(baseAtom);
    },
    (get, set, newValue: T, collectionId: string) => {
      set(baseAtom, newValue);
      const preferences = get(sortPreferenceAtom);
      console.log("Set", preferences);
      set(sortPreferenceAtom, {
        ...preferences,
        [collectionId]: {
          ...preferences[collectionId],
          [key]: newValue,
        },
      });
    }
  );
};

type SortByOption = ItemSortBy | { key: ItemSortBy; value: string };
type SortOrderOption = SortOrder | { key: SortOrder; value: string };

function getSortKey(
  option: SortByOption | SortOrderOption
): ItemSortBy | SortOrder {
  return typeof option === "string" ? option : option.key;
}

export const genreFilterAtom = createFilterAtom<string[]>("genreFilter", []);
export const tagsFilterAtom = createFilterAtom<string[]>("tagsFilter", []);
export const yearFilterAtom = createFilterAtom<string[]>("yearFilter", []);
export const sortByAtom = createFilterAtom<[typeof sortByOptions][number]>(
  "sortBy",
  [sortByOptions[0]]
);
export const sortOrderAtom = createFilterAtom<
  [typeof sortOrderOptions][number]
>("sortOrder", [sortOrderOptions[0]]);
