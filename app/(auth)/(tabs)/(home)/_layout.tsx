import { Chromecast } from "@/components/Chromecast";
import { HeaderBackButton } from "@/components/common/HeaderBackButton";
import { nestedTabPageScreenOptions } from "@/components/stacks/NestedTabPageStack";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Platform, TouchableOpacity, View } from "react-native";

export default function IndexLayout() {
  const router = useRouter();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerLargeTitle: true,
          headerTitle: "Home",
          headerBlurEffect: "prominent",
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              style={{
                marginRight: Platform.OS === "android" ? 17 : 0,
              }}
              onPress={() => {
                router.push("/(auth)/downloads");
              }}
            >
              <Feather name="download" color={"white"} size={22} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex flex-row items-center space-x-2">
              <TouchableOpacity
                onPress={() => {
                  router.push("/(auth)/syncplay");
                }}
                style={{
                  marginRight: 8,
                }}
              >
                <Ionicons name="people" color={"white"} size={22} />
              </TouchableOpacity>
              <Chromecast />
              <TouchableOpacity
                onPress={() => {
                  router.push("/(auth)/settings");
                }}
              >
                <View className="h-10 aspect-square flex items-center justify-center rounded">
                  <Feather name="settings" color={"white"} size={22} />
                </View>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="downloads"
        options={{
          title: "Downloads",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="syncplay"
        options={{
          title: "Syncplay",
          presentation: "modal",
        }}
      />
      {Object.entries(nestedTabPageScreenOptions).map(([name, options]) => (
        <Stack.Screen key={name} name={name} options={options} />
      ))}
    </Stack>
  );
}
