import { convertBitsToMegabitsOrGigabits } from "@/utils/bToMb";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "./common/Text";
import { usePlaySettings } from "@/providers/PlaySettingsProvider";

interface Props extends React.ComponentProps<typeof View> {}

export const MediaSourceSelector: React.FC<Props> = ({ ...props }) => {
  const { playSettings, setPlaySettings, playUrl } = usePlaySettings();

  const selectedMediaSource = useMemo(() => {
    console.log(
      "selectedMediaSource",
      playSettings?.mediaSource?.MediaStreams?.length
    );
    return (
      playSettings?.mediaSource?.MediaStreams?.find((x) => x.Type === "Video")
        ?.DisplayTitle || "N/A"
    );
  }, [playSettings?.mediaSource]);

  // Set default media source on component mount
  useEffect(() => {
    if (
      playSettings?.item?.MediaSources?.length &&
      !playSettings?.mediaSource
    ) {
      console.log(
        "Setting default media source",
        playSettings?.item?.MediaSources?.[0].Id
      );
      setPlaySettings((prev) => ({
        ...prev,
        mediaSource: playSettings?.item?.MediaSources?.[0],
      }));
    }
  }, [playSettings?.item?.MediaSources, setPlaySettings]);

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
          {playSettings?.item?.MediaSources?.map((source, idx: number) => (
            <DropdownMenu.Item
              key={idx.toString()}
              onSelect={() => {
                setPlaySettings((prev) => ({
                  ...prev,
                  mediaSource: source,
                }));
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
