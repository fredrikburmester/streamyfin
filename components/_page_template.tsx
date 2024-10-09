import { ScrollView, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_HEIGHT } from "@/constants/Values";

interface Props extends ViewProps {}

export default function page() {
  const insets = useSafeAreaInsets();
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
    ></ScrollView>
  );
}
