import { ScrollView, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LANGUAGES } from "@/constants/Languages";
import { ListItem } from "@/components/list/ListItem";
import { ListSection } from "@/components/list/ListSection";
import { TAB_HEIGHT } from "@/constants/Values";
import { DefaultLanguageOption, useSettings } from "@/utils/atoms/settings";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

interface Props extends ViewProps {}

export default function page() {
  const insets = useSafeAreaInsets();
  const [settings, updateSettings] = useSettings();
  return (
    <ScrollView
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: 16,
      }}
      style={{
        marginBottom: TAB_HEIGHT,
      }}
    >
      <View className="py-4 px-4">
        <ListSection title="LANGUAGES">
          {LANGUAGES.sort(sortByName).map((l) => (
            <ListItem
              key={l.value}
              title={l.label}
              onPress={() => {
                updateSettings({
                  ...settings,
                  defaultAudioLanguage: l,
                });
              }}
              iconAfter={
                settings?.defaultAudioLanguage?.value === l.value ? (
                  <Ionicons name="checkmark" size={24} color={Colors.primary} />
                ) : null
              }
            />
          ))}
        </ListSection>
      </View>
    </ScrollView>
  );
}

const sortByName = (a: DefaultLanguageOption, b: DefaultLanguageOption) => {
  if (a.label < b.label) {
    return -1;
  }
  if (a.label > b.label) {
    return 1;
  }
  return 0;
};
