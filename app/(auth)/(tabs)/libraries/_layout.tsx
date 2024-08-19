import { Stack, useRouter } from "expo-router";
import { Platform } from "react-native";

export default function IndexLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerLargeTitle: true,
          headerTitle: "Library",
          headerBlurEffect: "prominent",
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[libraryId]"
        options={{
          title: "",
          headerShown: true,
          headerBlurEffect: "prominent",
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
