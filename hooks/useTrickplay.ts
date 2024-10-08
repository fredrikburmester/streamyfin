// hooks/useTrickplay.ts

import { apiAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { useAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";

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

export const useTrickplay = (item: BaseItemDto, enabled = true) => {
  const [api] = useAtom(apiAtom);
  const [trickPlayUrl, setTrickPlayUrl] = useState<TrickplayUrl | null>(null);
  const lastCalculationTime = useRef(0);
  const throttleDelay = 200; // 200ms throttle

  const trickplayInfo = useMemo(() => {
    if (!enabled || !item.Id || !item.Trickplay) {
      return null;
    }

    const mediaSourceId = item.Id;
    const trickplayData = item.Trickplay[mediaSourceId];

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
  }, [item, enabled]);

  const calculateTrickplayUrl = useCallback(
    (progress: number) => {
      if (!enabled) {
        return null;
      }

      const now = Date.now();
      if (now - lastCalculationTime.current < throttleDelay) {
        return null;
      }
      lastCalculationTime.current = now;

      if (!trickplayInfo || !api || !item.Id) {
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
        url: `${api.basePath}/Videos/${item.Id}/Trickplay/${resolution}/${tileIndex}.jpg?api_key=${api.accessToken}`,
      };

      setTrickPlayUrl(newTrickPlayUrl);
      return newTrickPlayUrl;
    },
    [trickplayInfo, item, api, enabled]
  );

  return {
    trickPlayUrl: enabled ? trickPlayUrl : null,
    calculateTrickplayUrl: enabled ? calculateTrickplayUrl : () => null,
    trickplayInfo: enabled ? trickplayInfo : null,
  };
};
