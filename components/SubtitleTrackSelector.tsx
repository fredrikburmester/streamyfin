import { TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "./common/Text";
import { atom, useAtom } from "jotai";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client/models";
import { useEffect, useMemo } from "react";
import { MediaStream } from "@jellyfin/sdk/lib/generated-client/models";
import { tc } from "@/utils/textTools";
import { useSettings } from "@/utils/atoms/settings";

interface Props extends React.ComponentProps<typeof View> {
  source: MediaSourceInfo;
  onChange: (value: number) => void;
  selected: number;
}

export const SubtitleTrackSelector: React.FC<Props> = ({
  source,
  onChange,
  selected,
  ...props
}) => {
  const [settings] = useSettings();

  const subtitleStreams = useMemo(
    () => source.MediaStreams?.filter((x) => x.Type === "Subtitle") ?? [],
    [source]
  );

  const selectedSubtitleSteam = useMemo(
    () => subtitleStreams.find((x) => x.Index === selected),
    [subtitleStreams, selected]
  );

  useEffect(() => {
    // const index = source.DefaultAudioStreamIndex;
    // if (index !== undefined && index !== null) {
    //   onChange(index);
    //   return;
    // }
    const defaultSubIndex = subtitleStreams?.find(
      (x) => x.Language === settings?.defaultSubtitleLanguage?.value
    )?.Index;
    if (defaultSubIndex !== undefined && defaultSubIndex !== null) {
      onChange(defaultSubIndex);
      return;
    }

    onChange(-1);
  }, [subtitleStreams, settings]);

  if (subtitleStreams.length === 0) return null;

  return (
    <View
      className="flex col shrink justify-start place-self-start items-start"
      style={{
        minWidth: 60,
        maxWidth: 200,
      }}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View className="flex flex-col " {...props}>
            <Text className="opacity-50 mb-1 text-xs">Subtitle</Text>
            <TouchableOpacity className="bg-neutral-900  h-10 rounded-xl border-neutral-800 border px-3 py-2 flex flex-row items-center justify-between">
              <Text className=" ">
                {selectedSubtitleSteam
                  ? tc(selectedSubtitleSteam?.DisplayTitle, 7)
                  : "None"}
              </Text>
            </TouchableOpacity>
          </View>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          loop={true}
          side="bottom"
          align="start"
          alignOffset={0}
          avoidCollisions={true}
          collisionPadding={8}
          sideOffset={8}
        >
          <DropdownMenu.Label>Subtitle tracks</DropdownMenu.Label>
          <DropdownMenu.Item
            key={"-1"}
            onSelect={() => {
              onChange(-1);
            }}
          >
            <DropdownMenu.ItemTitle>None</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
          {subtitleStreams?.map((subtitle, idx: number) => (
            <DropdownMenu.Item
              key={idx.toString()}
              onSelect={() => {
                if (subtitle.Index !== undefined && subtitle.Index !== null)
                  onChange(subtitle.Index);
              }}
            >
              <DropdownMenu.ItemTitle>
                {subtitle.DisplayTitle}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  );
};
