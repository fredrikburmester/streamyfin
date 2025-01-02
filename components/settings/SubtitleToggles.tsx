import { TouchableOpacity, View, ViewProps } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "../common/Text";
import { useMedia } from "./MediaContext";
import { Switch } from "react-native-gesture-handler";
import { SubtitlePlaybackMode } from "@jellyfin/sdk/lib/generated-client";
import { useTranslation } from "react-i18next";

interface Props extends ViewProps {}

export const SubtitleToggles: React.FC<Props> = ({ ...props }) => {
  const media = useMedia();
  const { settings, updateSettings } = media;
  const cultures = media.cultures;
  const { t } = useTranslation();

  if (!settings) return null;

  const subtitleModes = [
    SubtitlePlaybackMode.Default,
    SubtitlePlaybackMode.Smart,
    SubtitlePlaybackMode.OnlyForced,
    SubtitlePlaybackMode.Always,
    SubtitlePlaybackMode.None,
  ];

  return (
    <View>
      <Text className="text-lg font-bold mb-2">{t("home.settings.subtitles.subtitle_title")}</Text>
      <View className="flex flex-col rounded-xl mb-4 overflow-hidden  divide-y-2 divide-solid divide-neutral-800">
        <View
          className={`
              flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
            `}
        >
          <View className="flex flex-col shrink">
            <Text className="font-semibold">{t("home.settings.subtitles.subtitle_language")}</Text>
            <Text className="text-xs opacity-50">
              {t("home.settings.subtitles.subtitle_language_hint")}
            </Text>
          </View>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                <Text>
                  {settings?.defaultSubtitleLanguage?.DisplayName || "None"}
                </Text>
              </TouchableOpacity>
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
              <DropdownMenu.Label>Languages</DropdownMenu.Label>
              <DropdownMenu.Item
                key={"none-subs"}
                onSelect={() => {
                  updateSettings({
                    defaultSubtitleLanguage: null,
                  });
                }}
              >
                <DropdownMenu.ItemTitle>None</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
              {cultures?.map((l) => (
                <DropdownMenu.Item
                  key={l?.ThreeLetterISOLanguageName ?? "unknown"}
                  onSelect={() => {
                    updateSettings({
                      defaultSubtitleLanguage: l,
                    });
                  }}
                >
                  <DropdownMenu.ItemTitle>
                    {l.DisplayName}
                  </DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </View>

        <View
          className={`
              flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
            `}
        >
          <View className="flex flex-col shrink">
            <Text className="font-semibold">{t("home.settings.subtitles.subtitle_mode")}</Text>
            <Text className="text-xs opacity-50 mr-2">
              {t("home.settings.subtitles.subtitle_mode_hint")}
            </Text>
          </View>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                <Text>{settings?.subtitleMode || "Loading"}</Text>
              </TouchableOpacity>
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
              <DropdownMenu.Label>Subtitle Mode</DropdownMenu.Label>
              {subtitleModes?.map((l) => (
                <DropdownMenu.Item
                  key={l}
                  onSelect={() => {
                    updateSettings({
                      subtitleMode: l,
                    });
                  }}
                >
                  <DropdownMenu.ItemTitle>{l}</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </View>

        <View className="flex flex-col">
          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="flex flex-col">
              <Text className="font-semibold">
                {t("home.settings.subtitles.set_subtitle_track")}
              </Text>
              <Text className="text-xs opacity-50 min max-w-[85%]">
                {t("home.settings.subtitles.set_subtitle_track_hint")}
              </Text>
            </View>
            <Switch
              value={settings.rememberSubtitleSelections}
              onValueChange={(value) =>
                updateSettings({ rememberSubtitleSelections: value })
              }
            />
          </View>
        </View>

        <View
          className={`
              flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
            `}
        >
          <View className="flex flex-col shrink">
            <Text className="font-semibold">{t("home.settings.subtitles.subtitle_size")}</Text>
            <Text className="text-xs opacity-50">
              {t("home.settings.subtitles.subtitle_size_hint")}
            </Text>
          </View>
          <View className="flex flex-row items-center">
            <TouchableOpacity
              onPress={() =>
                updateSettings({
                  subtitleSize: Math.max(0, settings.subtitleSize - 5),
                })
              }
              className="w-8 h-8 bg-neutral-800 rounded-l-lg flex items-center justify-center"
            >
              <Text>-</Text>
            </TouchableOpacity>
            <Text className="w-12 h-8 bg-neutral-800 first-letter:px-3 py-2 flex items-center justify-center">
              {settings.subtitleSize}
            </Text>
            <TouchableOpacity
              className="w-8 h-8 bg-neutral-800 rounded-r-lg flex items-center justify-center"
              onPress={() =>
                updateSettings({
                  subtitleSize: Math.min(120, settings.subtitleSize + 5),
                })
              }
            >
              <Text>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};
