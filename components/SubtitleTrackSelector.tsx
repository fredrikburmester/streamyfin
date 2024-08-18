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

export const SubtitleTrackSelector: React.FC<Props> = ({
  item,
  onChange,
  selected,
  ...props
}) => {
  const subtitleStreams = useMemo(
    () =>
      item.MediaSources?.[0].MediaStreams?.filter(
        (x) => x.Type === "Subtitle"
      ) ?? [],
    [item]
  );

  const selectedSubtitleSteam = useMemo(
    () => subtitleStreams.find((x) => x.Index === selected),
    [subtitleStreams, selected]
  );

  useEffect(() => {
    const index = item.MediaSources?.[0].DefaultSubtitleStreamIndex;
    if (index !== undefined && index !== null) {
      onChange(index);
    } else {
      onChange(-1);
    }
  }, []);

  if (subtitleStreams.length === 0) return null;

  return (
    <View
      className="flex flex-row items-center justify-between"
      {...props}
    ></View>
  );
};
