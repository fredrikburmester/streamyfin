import { TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
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
        (x) => x.Type === "Subtitle",
      ) ?? [],
    [item],
  );

  const selectedSubtitleSteam = useMemo(
    () => subtitleStreams.find((x) => x.Index === selected),
    [subtitleStreams, selected],
  );

  useEffect(() => {
    const index = item.MediaSources?.[0].DefaultSubtitleStreamIndex;
    if (index !== undefined && index !== null) {
      onChange(index);
    } else {
      // Get first subtitle stream
      const firstSubtitle = subtitleStreams.find((x) => x.Index !== undefined);
      if (firstSubtitle?.Index !== undefined) {
        onChange(firstSubtitle.Index);
      }
    }
  }, []);

  if (subtitleStreams.length === 0) return null;

  return (
    <View className="flex flex-row items-center justify-between" {...props}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View className="flex flex-col mb-2">
            <Text className="opacity-50 mb-1 text-xs">Subtitles</Text>
            <View className="flex flex-row">
              <TouchableOpacity className="bg-neutral-900 max-w-32 h-12 rounded-2xl border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                <Text className="">
                  {tc(selectedSubtitleSteam?.DisplayTitle, 13)}
                </Text>
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
          <DropdownMenu.Label>Subtitles</DropdownMenu.Label>
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
