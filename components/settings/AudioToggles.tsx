import { TouchableOpacity, View, ViewProps } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "../common/Text";
import { useMedia } from "./MediaContext";
import { Switch } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

interface Props extends ViewProps {}

export const AudioToggles: React.FC<Props> = ({ ...props }) => {
  const media = useMedia();
  const { settings, updateSettings } = media;
  const cultures = media.cultures;
  const { t } = useTranslation();

  if (!settings) return null;

  return (
    <View>
      <Text className="text-lg font-bold mb-2">{t("home.settings.audio.audio_title")}</Text>
      <View className="flex flex-col rounded-xl mb-4 overflow-hidden  divide-y-2 divide-solid divide-neutral-800">
        <View
          className={`
              flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
            `}
        >
          <View className="flex flex-col shrink">
            <Text className="font-semibold">{t("home.settings.audio.audio_language")}</Text>
            <Text className="text-xs opacity-50">
              {t("home.settings.audio.audio_language_hint")}
            </Text>
          </View>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                <Text>
                  {settings?.defaultAudioLanguage?.DisplayName || "None"}
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
                key={"none-audio"}
                onSelect={() => {
                  updateSettings({
                    defaultAudioLanguage: null,
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
                      defaultAudioLanguage: l,
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
        <View className="flex flex-col">
          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="flex flex-col">
              <Text className="font-semibold">{t("home.settings.audio.use_default_audio")}</Text>
              <Text className="text-xs opacity-50">
                {t("home.settings.audio.use_default_audio_hint")}
              </Text>
            </View>
            <Switch
              value={settings.playDefaultAudioTrack}
              onValueChange={(value) =>
                updateSettings({ playDefaultAudioTrack: value })
              }
            />
          </View>
        </View>
        <View className="flex flex-col">
          <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
            <View className="flex flex-col">
              <Text className="font-semibold">
                {t("home.settings.audio.set_audio_track")}
              </Text>
              <Text className="text-xs opacity-50 min max-w-[85%]">
                {t("home.settings.audio.set_audio_track_hint")}
              </Text>
            </View>
            <Switch
              value={settings.rememberAudioSelections}
              onValueChange={(value) =>
                updateSettings({ rememberAudioSelections: value })
              }
            />
          </View>
        </View>
      </View>
    </View>
  );
};
