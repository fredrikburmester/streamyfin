import { TouchableOpacity, View } from "react-native";
import { Text } from "./common/Text";
import { atom, useAtom } from "jotai";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useEffect, useMemo } from "react";
import { MediaStream } from "@jellyfin/sdk/lib/generated-client/models";
import { tc } from "@/utils/textTools";

interface Props extends React.ComponentProps<typeof View> {
  item: BaseItemDto;
  onChange: (value: number) => void;
  selected: number;
}

export const AudioTrackSelector: React.FC<Props> = ({
  item,
  onChange,
  selected,
  ...props
}) => {
  const audioStreams = useMemo(
    () =>
      item.MediaSources?.[0].MediaStreams?.filter((x) => x.Type === "Audio"),
    [item]
  );

  const selectedAudioSteam = useMemo(
    () => audioStreams?.find((x) => x.Index === selected),
    [audioStreams, selected]
  );

  useEffect(() => {
    const index = item.MediaSources?.[0].DefaultAudioStreamIndex;
    if (index !== undefined && index !== null) onChange(index);
  }, []);

  return (
    <View
      className="flex flex-row items-center justify-between"
      {...props}
    ></View>
  );
};
