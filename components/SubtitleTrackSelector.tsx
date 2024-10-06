import { usePlaySettings } from "@/providers/PlaySettingsProvider";
import { useSettings } from "@/utils/atoms/settings";
import { tc } from "@/utils/textTools";
import { useEffect, useMemo } from "react";
import { TouchableOpacity, View, ViewProps } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "./common/Text";

interface Props extends ViewProps {}

export const SubtitleTrackSelector: React.FC<Props> = ({ ...props }) => {
  const { playSettings, setPlaySettings, playUrl } = usePlaySettings();
  const [settings] = useSettings();

  const subtitleStreams = useMemo(
    () =>
      playSettings?.mediaSource?.MediaStreams?.filter(
        (x) => x.Type === "Subtitle"
      ) ?? [],
    [playSettings?.mediaSource]
  );

  const selectedSubtitleSteam = useMemo(
    () => subtitleStreams.find((x) => x.Index === playSettings?.subtitleIndex),
    [subtitleStreams, playSettings?.subtitleIndex]
  );

  useEffect(() => {
    const defaultSubIndex = subtitleStreams?.find(
      (x) => x.Language === settings?.defaultSubtitleLanguage?.value
    )?.Index;
    if (defaultSubIndex !== undefined && defaultSubIndex !== null) {
      setPlaySettings((prev) => ({
        ...prev,
        subtitleIndex: defaultSubIndex,
      }));
      return;
    }

    setPlaySettings((prev) => ({
      ...prev,
      subtitleIndex: -1,
    }));
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
              setPlaySettings((prev) => ({
                ...prev,
                subtitleIndex: -1,
              }));
            }}
          >
            <DropdownMenu.ItemTitle>None</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
          {subtitleStreams?.map((subtitle, idx: number) => (
            <DropdownMenu.Item
              key={idx.toString()}
              onSelect={() => {
                if (subtitle.Index !== undefined && subtitle.Index !== null)
                  setPlaySettings((prev) => ({
                    ...prev,
                    subtitleIndex: subtitle.Index,
                  }));
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
