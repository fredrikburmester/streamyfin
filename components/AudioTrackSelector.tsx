import { TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "./common/Text";
import { atom, useAtom } from "jotai";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useEffect, useMemo } from "react";
import { MediaStream } from "@jellyfin/sdk/lib/generated-client/models";

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
  console.log(
    item.MediaSources?.[0].MediaStreams?.filter((x) => x.Type === "Audio"),
  );

  const audioStreams = useMemo(
    () =>
      item.MediaSources?.[0].MediaStreams?.filter((x) => x.Type === "Audio"),
    [item],
  );

  const selectedAudioSteam = useMemo(
    () => audioStreams?.[selected],
    [audioStreams, selected],
  );

  return (
    <View className="flex flex-row items-center justify-between" {...props}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View className="flex flex-col mb-2">
            <Text className="opacity-50 mb-1 text-xs">Bitrate</Text>
            <View className="flex flex-row">
              <TouchableOpacity className="bg-neutral-900 rounded-2xl border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                <Text>{selectedAudioSteam?.DisplayTitle}</Text>
              </TouchableOpacity>
            </View>
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
          <DropdownMenu.Label>Bitrates</DropdownMenu.Label>
          {audioStreams?.map((audio, index: number) => (
            <DropdownMenu.Item
              key={index.toString()}
              onSelect={() => {
                onChange(index);
              }}
            >
              <DropdownMenu.ItemTitle>
                {audio.DisplayTitle}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  );
};
