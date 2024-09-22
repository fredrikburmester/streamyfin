// hooks/useTrickplay.ts

import { useState, useCallback, useMemo, useRef } from "react";
import { Api } from "@jellyfin/sdk";
import { SharedValue } from "react-native-reanimated";
import { CurrentlyPlayingState } from "@/providers/PlaybackProvider";
import { useAtom } from "jotai";
import { apiAtom } from "@/providers/JellyfinProvider";

interface TrickplayData {
  Interval?: number;
  TileWidth?: number;
  TileHeight?: number;
  Height?: number;
  Width?: number;
  ThumbnailCount?: number;
}

interface TrickplayInfo {
  resolution: string;
  aspectRatio: number;
  data: TrickplayData;
}

interface TrickplayUrl {
  x: number;
  y: number;
  url: string;
}

export const useTrickplay = (
  currentlyPlaying?: CurrentlyPlayingState | null
) => {
  const [api] = useAtom(apiAtom);
  const [trickPlayUrl, setTrickPlayUrl] = useState<TrickplayUrl | null>(null);
  const lastCalculationTime = useRef(0);
  const throttleDelay = 200; // 200ms throttle

  const trickplayInfo = useMemo(() => {
    if (!currentlyPlaying?.item.Id || !currentlyPlaying?.item.Trickplay) {
      return null;
    }

    const mediaSourceId = currentlyPlaying.item.Id;
    const trickplayData = currentlyPlaying.item.Trickplay[mediaSourceId];

    if (!trickplayData) {
      return null;
    }

    // Get the first available resolution
    const firstResolution = Object.keys(trickplayData)[0];
    return firstResolution
      ? {
          resolution: firstResolution,
          aspectRatio:
            trickplayData[firstResolution].Width! /
            trickplayData[firstResolution].Height!,
          data: trickplayData[firstResolution],
        }
      : null;
  }, [currentlyPlaying]);

  const calculateTrickplayUrl = useCallback(
    (progress: number) => {
      const now = Date.now();
      if (now - lastCalculationTime.current < throttleDelay) {
        return null;
      }
      lastCalculationTime.current = now;

      if (!trickplayInfo || !api || !currentlyPlaying?.item.Id) {
        return null;
      }

      const { data, resolution } = trickplayInfo;
      const { Interval, TileWidth, TileHeight } = data;

      if (!Interval || !TileWidth || !TileHeight || !resolution) {
        throw new Error("Invalid trickplay data");
      }

      const currentSecond = Math.max(0, Math.floor(progress / 10000000));

      const cols = TileWidth;
      const rows = TileHeight;
      const imagesPerTile = cols * rows;
      const imageIndex = Math.floor(currentSecond / (Interval / 1000));
      const tileIndex = Math.floor(imageIndex / imagesPerTile);

      const positionInTile = imageIndex % imagesPerTile;
      const rowInTile = Math.floor(positionInTile / cols);
      const colInTile = positionInTile % cols;

      const newTrickPlayUrl = {
        x: rowInTile,
        y: colInTile,
        url: `${api.basePath}/Videos/${currentlyPlaying.item.Id}/Trickplay/${resolution}/${tileIndex}.jpg?api_key=${api.accessToken}`,
      };

      setTrickPlayUrl(newTrickPlayUrl);
      return newTrickPlayUrl;
    },
    [trickplayInfo, currentlyPlaying, api]
  );

  return { trickPlayUrl, calculateTrickplayUrl, trickplayInfo };
};
