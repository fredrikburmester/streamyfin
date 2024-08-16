import { Linking, Switch, TouchableOpacity, View } from "react-native";
import { Text } from "../common/Text";
import { useSettings } from "@/utils/atoms/settings";
import * as DropdownMenu from "zeego/dropdown-menu";

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
      <View className="flex flex-row space-x-2 items-center justify-between bg-neutral-900 p-4">
        <View className="flex flex-col shrink">
          <Text className="font-semibold">Force direct play</Text>
          <Text className="text-xs opacity-50 shrink">
            This will always request direct play. This is good if you want to
            try to stream movies you think the device supports.
          </Text>
        </View>
        <Switch
          value={settings?.forceDirectPlay}
          onValueChange={(value) => updateSettings({ forceDirectPlay: value })}
        />
      </View>
      <View
        className={`
        flex flex-row items-center space-x-2 justify-between bg-neutral-900 p-4
        ${settings?.forceDirectPlay ? "opacity-50 select-none" : ""}
      `}
      >
        <View className="flex flex-col shrink">
          <Text className="font-semibold">Device profile</Text>
          <Text className="text-xs opacity-50">
            A profile used for deciding what audio and video codecs the device
            supports.
          </Text>
        </View>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <TouchableOpacity className="bg-neutral-800 rounded-lg border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
              <Text>{settings?.deviceProfile}</Text>
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
            <DropdownMenu.Label>Profiles</DropdownMenu.Label>
            <DropdownMenu.Item
              key="1"
              onSelect={() => {
                updateSettings({ deviceProfile: "Expo" });
              }}
            >
              <DropdownMenu.ItemTitle>Expo</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              key="2"
              onSelect={() => {
                updateSettings({ deviceProfile: "Native" });
              }}
            >
              <DropdownMenu.ItemTitle>Native</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              key="3"
              onSelect={() => {
                updateSettings({ deviceProfile: "Old" });
              }}
            >
              <DropdownMenu.ItemTitle>Old</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </View>
    </View>
  );
};
