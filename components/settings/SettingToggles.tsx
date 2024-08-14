import { Switch, View } from "react-native";
import { Text } from "../common/Text";
import { useAtom } from "jotai";
import { useSettings } from "@/utils/atoms/settings";

export const SettingToggles: React.FC = () => {
  const [settings, updateSettings] = useSettings();

  return (
    <View className="flex flex-col rounded-xl mb-4 overflow-hidden border-neutral-800 divide-y-2 divide-solid divide-neutral-800 ">
      <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
        <Text>Auto rotate</Text>
        <Switch
          value={settings?.autoRotate}
          onValueChange={(value) => updateSettings({ autoRotate: value })}
        />
      </View>
    </View>
  );
};
