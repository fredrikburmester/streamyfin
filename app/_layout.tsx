import { DownloadProvider } from "@/providers/DownloadProvider";
import { JellyfinProvider } from "@/providers/JellyfinProvider";
import { JobQueueProvider } from "@/providers/JobQueueProvider";
import { PlaybackProvider } from "@/providers/PlaybackProvider";
import { orientationAtom } from "@/utils/atoms/orientation";
import { useSettings } from "@/utils/atoms/settings";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { checkForExistingDownloads } from "@kesha-antonov/react-native-background-downloader";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { useKeepAwake } from "expo-keep-awake";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider, useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
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
  const [settings, updateSettings] = useSettings();
  const [orientation, setOrientation] = useAtom(orientationAtom);

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

  useEffect(() => {
    if (settings?.autoRotate === true)
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    else
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
  }, [settings]);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        checkForExistingDownloads();
      }
    });

    checkForExistingDownloads();

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        setOrientation(event.orientationInfo.orientation);
      }
    );

    ScreenOrientation.getOrientationAsync().then((initialOrientation) => {
      setOrientation(initialOrientation);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  const url = Linking.useURL();

  if (url) {
    const { hostname, path, queryParams } = Linking.parse(url);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClientRef.current}>
        <JobQueueProvider>
          <DownloadProvider>
            <ActionSheetProvider>
              <BottomSheetModalProvider>
                <JellyfinProvider>
                  <PlaybackProvider>
                    <StatusBar style="light" backgroundColor="#000" />
                    <ThemeProvider value={DarkTheme}>
                      <Stack
                        initialRouteName="/home"
                        screenOptions={{
                          autoHideHomeIndicator: true,
                        }}
                      >
                        <Stack.Screen
                          name="(auth)/(tabs)"
                          options={{
                            headerShown: false,
                            title: "",
                          }}
                        />
                        <Stack.Screen
                          name="(auth)/play"
                          options={{
                            headerShown: false,
                            title: "",
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="login"
                          options={{ headerShown: false, title: "Login" }}
                        />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      <Toaster
                        duration={2000}
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
                  </PlaybackProvider>
                </JellyfinProvider>
              </BottomSheetModalProvider>
            </ActionSheetProvider>
          </DownloadProvider>
        </JobQueueProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
