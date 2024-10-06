import { useSettings } from "@/utils/atoms/settings";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { TouchableOpacity, View, ViewProps } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "./common/Text";
import { usePlaySettings } from "@/providers/PlaySettingsProvider";

interface Props extends ViewProps {}

export const AudioTrackSelector: React.FC<Props> = ({ ...props }) => {
  const { playSettings, setPlaySettings, playUrl } = usePlaySettings();
  const [settings] = useSettings();

  const selectedIndex = useMemo(() => {
    return playSettings?.audioIndex;
  }, [playSettings?.audioIndex]);

  const audioStreams = useMemo(
    () =>
      playSettings?.mediaSource?.MediaStreams?.filter(
        (x) => x.Type === "Audio"
      ),
    [playSettings?.mediaSource]
  );

  const selectedAudioStream = useMemo(
    () => audioStreams?.find((x) => x.Index === selectedIndex),
    [audioStreams, selectedIndex]
  );

  // Set default audio stream only if none is selected and we have audio streams
  useEffect(() => {
    if (playSettings?.audioIndex !== undefined || !audioStreams?.length) return;

    const defaultAudioIndex = audioStreams.find(
      (x) => x.Language === settings?.defaultAudioLanguage
    )?.Index;

    if (defaultAudioIndex !== undefined) {
      setPlaySettings((prev) => ({
        ...prev,
        audioIndex: defaultAudioIndex,
      }));
    } else {
      const index = playSettings?.mediaSource?.DefaultAudioStreamIndex ?? 0;
      setPlaySettings((prev) => ({
        ...prev,
        audioIndex: index,
      }));
    }
  }, [
    audioStreams,
    settings?.defaultAudioLanguage,
    playSettings?.mediaSource,
    setPlaySettings,
  ]);

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
            <Text className="opacity-50 mb-1 text-xs">Audio</Text>
            <TouchableOpacity className="bg-neutral-900  h-10 rounded-xl border-neutral-800 border px-3 py-2 flex flex-row items-center justify-between">
              <Text className="" numberOfLines={1}>
                {selectedAudioStream?.DisplayTitle}
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
          <DropdownMenu.Label>Audio streams</DropdownMenu.Label>
          {audioStreams?.map((audio, idx: number) => (
            <DropdownMenu.Item
              key={idx.toString()}
              onSelect={() => {
                if (audio.Index !== null && audio.Index !== undefined)
                  setPlaySettings((prev) => ({
                    ...prev,
                    audioIndex: audio.Index,
                  }));
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
