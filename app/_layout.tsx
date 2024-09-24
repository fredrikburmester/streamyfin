import { FullScreenVideoPlayer } from "@/components/FullScreenVideoPlayer";
import { JellyfinProvider } from "@/providers/JellyfinProvider";
import { JobQueueProvider } from "@/providers/JobQueueProvider";
import { PlaybackProvider } from "@/providers/PlaybackProvider";
import { useSettings } from "@/utils/atoms/settings";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { useKeepAwake } from "expo-keep-awake";
import { Stack, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider, useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import * as Linking from "expo-linking";
import { orientationAtom } from "@/utils/atoms/orientation";
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

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        console.log(event.orientationInfo.orientation);
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
                        options={{ headerShown: false, title: "" }}
                      />
                      <Stack.Screen
                        name="login"
                        options={{ headerShown: false, title: "Login" }}
                      />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    {/* <FullScreenVideoPlayer /> */}
                    <Toaster />
                  </ThemeProvider>
                </PlaybackProvider>
              </JellyfinProvider>
            </BottomSheetModalProvider>
          </ActionSheetProvider>
        </JobQueueProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
