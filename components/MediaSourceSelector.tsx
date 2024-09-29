import { tc } from "@/utils/textTools";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client/models";
import { useEffect, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "./common/Text";
import { convertBitsToMegabitsOrGigabits } from "@/utils/bToMb";

interface Props extends React.ComponentProps<typeof View> {
  item: BaseItemDto;
  onChange: (value: MediaSourceInfo) => void;
  selected: MediaSourceInfo | null;
}

export const MediaSourceSelector: React.FC<Props> = ({
  item,
  onChange,
  selected,
  ...props
}) => {
  const mediaSources = useMemo(() => {
    return item.MediaSources;
  }, [item]);

  const selectedMediaSource = useMemo(
    () =>
      mediaSources
        ?.find((x) => x.Id === selected?.Id)
        ?.MediaStreams?.find((x) => x.Type === "Video")?.DisplayTitle || "",
    [mediaSources, selected]
  );

  useEffect(() => {
    if (mediaSources?.length) onChange(mediaSources[0]);
  }, [mediaSources]);

  const name = (name?: string | null) => {
    if (name && name.length > 40)
      return (
        name.substring(0, 20) + " [...] " + name.substring(name.length - 20)
      );
    return name;
  };

  return (
    <View
      className="flex shrink"
      style={{
        minWidth: 50,
      }}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View className="flex flex-col" {...props}>
            <Text className="opacity-50 mb-1 text-xs">Video</Text>
            <TouchableOpacity className="bg-neutral-900 h-10 rounded-xl border-neutral-800 border px-3 py-2 flex flex-row items-center ">
              <Text numberOfLines={1}>{selectedMediaSource}</Text>
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
          <DropdownMenu.Label>Media sources</DropdownMenu.Label>
          {mediaSources?.map((source, idx: number) => (
            <DropdownMenu.Item
              key={idx.toString()}
              onSelect={() => {
                onChange(source);
              }}
            >
              <DropdownMenu.ItemTitle>
                {`${name(source.Name)} - ${convertBitsToMegabitsOrGigabits(
                  source.Size
                )}`}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  );
};
