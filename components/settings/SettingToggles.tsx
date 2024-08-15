import { Linking, Switch, TouchableOpacity, View } from "react-native";
import { Text } from "../common/Text";
import { useAtom } from "jotai";
import { useSettings } from "@/utils/atoms/settings";

export const SettingToggles: React.FC = () => {
  const [settings, updateSettings] = useSettings();

  return (
    <View className="flex flex-col rounded-xl mb-4 overflow-hidden border-neutral-800 divide-y-2 divide-solid divide-neutral-800 ">
      <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
        <View className="shrink">
          <Text className="font-semibold">Auto rotate</Text>
          <Text className="text-xs opacity-50">
            Important on android since the video player orientation is locked to
            the app orientation.
          </Text>
        </View>
        <Switch
          value={settings?.autoRotate}
          onValueChange={(value) => updateSettings({ autoRotate: value })}
        />
      </View>
      <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
        <View className="shrink">
          <Text className="font-semibold">Start videos in fullscreen</Text>
          <Text className="text-xs opacity-50">
            Clicking a video will start it in fullscreen mode, instead of
            inline.
          </Text>
        </View>
        <Switch
          value={settings?.openFullScreenVideoPlayerByDefault}
          onValueChange={(value) =>
            updateSettings({ openFullScreenVideoPlayerByDefault: value })
          }
        />
      </View>
      <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
        <View className="flex flex-col">
          <Text className="font-semibold">Use popular lists plugin</Text>
          <Text className="text-xs opacity-50">Made by: lostb1t</Text>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                "https://github.com/lostb1t/jellyfin-plugin-media-lists",
              );
            }}
          >
            <Text className="text-xs text-purple-600">More info</Text>
          </TouchableOpacity>
        </View>
        <Switch
          value={settings?.usePopularPlugin}
          onValueChange={(value) => updateSettings({ usePopularPlugin: value })}
        />
      </View>
    </View>
  );
};
