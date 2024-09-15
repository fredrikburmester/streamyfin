// hooks/useTrickplay.ts

import { useState, useCallback } from "react";
import { Api } from "@jellyfin/sdk";
import { SharedValue } from "react-native-reanimated";

interface TrickplayInfo {
  data: {
    Interval?: number;
    TileWidth?: number;
    TileHeight?: number;
    Height?: number;
    Width?: number;
    ThumbnailCount?: number;
  };
  resolution?: string;
}

interface TrickplayUrl {
  x: number;
  y: number;
  url: string;
}

export const useTrickplay = () => {
  const [trickPlayUrl, setTrickPlayUrl] = useState<TrickplayUrl | null>(null);

  const calculateTrickplayUrl = useCallback(
    (
      info: TrickplayInfo | null,
      progress: SharedValue<number>,
      api: Api | null,
      id: string
    ) => {
      if (!info || !id || !api) {
        return null;
      }

      const { data, resolution } = info;
      const { Interval, TileWidth, TileHeight, Height, Width, ThumbnailCount } =
        data;

      if (
        !Interval ||
        !TileWidth ||
        !TileHeight ||
        !Height ||
        !Width ||
        !ThumbnailCount ||
        !resolution
      ) {
        throw new Error("Invalid trickplay data");
      }

      const currentSecond = Math.max(0, Math.floor(progress.value / 10000000));

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
        url: `${api.basePath}/Videos/${id}/Trickplay/${resolution}/${tileIndex}.jpg?api_key=${api.accessToken}`,
      };

      setTrickPlayUrl(newTrickPlayUrl);
      return newTrickPlayUrl;
    },
    []
  );

  return { trickPlayUrl, calculateTrickplayUrl };
};
