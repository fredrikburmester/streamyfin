import { useState } from "react";
import { Button } from "./Button";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { currentlyPlayingItemAtom } from "./CurrentlyPlayingBar";
import { useAtom } from "jotai";
import { Feather, Ionicons } from "@expo/vector-icons";
import { runtimeTicksToMinutes } from "@/utils/time";

type Props = {
  item: BaseItemDto;
  onPress: () => void;
  chromecastReady: boolean;
};

export const PlayButton: React.FC<Props> = ({
  item,
  onPress,
  chromecastReady,
}) => {
  return (
    <Button
      onPress={onPress}
      iconRight={
        chromecastReady ? (
          <Feather name="cast" size={20} color="white" />
        ) : (
          <Ionicons name="play-circle" size={24} color="white" />
        )
      }
    >
      {runtimeTicksToMinutes(item?.RunTimeTicks)}
    </Button>
  );
};
