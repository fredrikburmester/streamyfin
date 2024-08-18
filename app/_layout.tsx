import { CurrentlyPlayingBar } from "@/components/CurrentlyPlayingBar";
import { JellyfinProvider } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { useKeepAwake } from "expo-keep-awake";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider } from "jotai";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "/index",
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <JotaiProvider>
      <Layout />
    </JotaiProvider>
  );
}

function Layout() {
  useKeepAwake();

  const queryClientRef = useRef<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnMount: true,
          refetchOnReconnect: true,
          refetchOnWindowFocus: true,
          retryOnMount: true,
        },
      },
    })
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClientRef.current}>
        <ActionSheetProvider>
          <BottomSheetModalProvider>
            <JellyfinProvider>
              <StatusBar style="light" backgroundColor="#000" />
              <ThemeProvider value={DarkTheme}>
                <Stack initialRouteName="/home">
                  <Stack.Screen
                    name="(auth)/(tabs)"
                    options={{
                      headerShown: false,
                      title: "",
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/settings"
                    options={{
                      headerShown: true,
                      title: "Settings",
                      headerStyle: { backgroundColor: "black" },
                      headerShadowVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/items/[id]"
                    options={{
                      title: "",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/collections/[collectionId]"
                    options={{
                      title: "",
                      headerShown: true,
                      headerStyle: { backgroundColor: "black" },
                      headerShadowVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/artists/page"
                    options={{
                      title: "",
                      headerShown: true,
                      headerStyle: { backgroundColor: "black" },
                      headerShadowVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/artists/[artistId]/page"
                    options={{
                      title: "",
                      headerShown: true,
                      headerStyle: { backgroundColor: "black" },
                      headerShadowVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/albums/[albumId]"
                    options={{
                      title: "",
                      headerShown: true,
                      headerStyle: { backgroundColor: "black" },
                      headerShadowVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/songs/[songId]"
                    options={{
                      title: "",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/series/[id]"
                    options={{
                      title: "",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="login"
                    options={{ headerShown: false, title: "Login" }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <CurrentlyPlayingBar />
              </ThemeProvider>
            </JellyfinProvider>
          </BottomSheetModalProvider>
        </ActionSheetProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
