import { tc } from "@/utils/textTools";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client/models";
import { useEffect, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "./common/Text";

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

  return (
    <View className="flex flex-row items-center justify-between" {...props}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View className="flex flex-col">
            <Text className="opacity-50 mb-1 text-xs">Video</Text>
            <View className="flex flex-row">
              <TouchableOpacity className="bg-neutral-900 max-w-32 h-10 rounded-xl border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                <Text className="">{tc(selectedMediaSource, 7)}</Text>
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
          <DropdownMenu.Label>Media sources</DropdownMenu.Label>
          {mediaSources?.map((source, idx: number) => (
            <DropdownMenu.Item
              key={idx.toString()}
              onSelect={() => {
                onChange(source);
              }}
            >
              <DropdownMenu.ItemTitle>
                {
                  source.MediaStreams?.find((s) => s.Type === "Video")
                    ?.DisplayTitle
                }
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  );
};
