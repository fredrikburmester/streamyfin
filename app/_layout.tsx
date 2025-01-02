import "@/augmentations";
import { JellyfinProvider } from "@/providers/JellyfinProvider";
import { JobQueueProvider } from "@/providers/JobQueueProvider";
import { PlaySettingsProvider } from "@/providers/PlaySettingsProvider";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { orientationAtom } from "@/utils/atoms/orientation";
import { useSettings } from "@/utils/atoms/settings";
import { LogProvider, writeToLog } from "@/utils/log";
import { storage } from "@/utils/mmkv";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { useKeepAwake } from "expo-keep-awake";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { Provider as JotaiProvider, useAtom } from "jotai";
import { useEffect } from "react";
import { Appearance } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Toaster } from "sonner-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  Appearance.setColorScheme("dark");

  if (!loaded) {
    return null;
  }

  return (
    <JotaiProvider>
      <Layout />
    </JotaiProvider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retryOnMount: true,
    },
  },
});

function Layout() {
  useKeepAwake();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ActionSheetProvider>
          <JobQueueProvider>
            <JellyfinProvider>
              <PlaySettingsProvider>
                <LogProvider>
                  <WebSocketProvider>
                    <BottomSheetModalProvider>
                      <SystemBars style="light" hidden={false} />
                      <ThemeProvider value={DarkTheme}>
                        <Stack initialRouteName="/home">
                          <Stack.Screen
                            name="(auth)/(tabs)"
                            options={{
                              headerShown: false,
                              title: "",
                              header: () => null,
                            }}
                          />
                          <Stack.Screen
                            name="(auth)/player"
                            options={{
                              headerShown: false,
                              title: "",
                              header: () => null,
                            }}
                          />
                          <Stack.Screen
                            name="(auth)/trailer/page"
                            options={{
                              headerShown: false,
                              presentation: "modal",
                              title: "",
                            }}
                          />
                          <Stack.Screen
                            name="login"
                            options={{
                              headerShown: true,
                              title: "",
                              headerTransparent: true,
                            }}
                          />
                          <Stack.Screen name="+not-found" />
                        </Stack>
                        <Toaster
                          duration={4000}
                          toastOptions={{
                            style: {
                              backgroundColor: "#262626",
                              borderColor: "#363639",
                              borderWidth: 1,
                            },
                            titleStyle: {
                              color: "white",
                            },
                          }}
                          closeButton
                        />
                      </ThemeProvider>
                    </BottomSheetModalProvider>
                  </WebSocketProvider>
                </LogProvider>
              </PlaySettingsProvider>
            </JellyfinProvider>
          </JobQueueProvider>
        </ActionSheetProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
