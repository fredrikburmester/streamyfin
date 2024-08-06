import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { JellyfinProvider } from "@/providers/JellyfinProvider";
import { TouchableOpacity } from "react-native";

import Feather from "@expo/vector-icons/Feather";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(auth)/(tabs)/",
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const queryClientRef = useRef<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60,
          refetchOnMount: true,
          refetchOnReconnect: true,
          refetchOnWindowFocus: true,
          retryOnMount: true,
        },
      },
    })
  );

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <JotaiProvider>
        <JellyfinProvider>
          <StatusBar style="auto" />
          <ThemeProvider value={DarkTheme}>
            <Stack>
              <Stack.Screen
                name="(auth)/(tabs)"
                options={{
                  headerShown: false,
                  title: "Home",
                }}
              />
              <Stack.Screen
                name="(auth)/settings"
                options={{
                  headerShown: true,
                  title: "Settings",
                  presentation: "modal",
                  headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()}>
                      <Feather name="x-circle" size={24} color="white" />
                    </TouchableOpacity>
                  ),
                }}
              />
              <Stack.Screen
                name="(auth)/player/offline/page"
                options={{
                  title: "",
                  headerShown: true,
                  headerStyle: { backgroundColor: "transparent" },
                }}
              />
              <Stack.Screen
                name="(auth)/items/[id]/page"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(auth)/collections/[collection]/page"
                options={{
                  title: "",
                  headerShown: true,
                  headerStyle: { backgroundColor: "transparent" },
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="(auth)/series/[id]/page"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="login"
                options={{ headerShown: false, title: "Login" }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ThemeProvider>
        </JellyfinProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
}
