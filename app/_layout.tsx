import { JellyfinProvider } from "@/providers/JellyfinProvider";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Provider as JotaiProvider } from "jotai";
import { useEffect, useRef, useState } from "react";
import "react-native-reanimated";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CurrentlyPlayingBar } from "@/components/CurrentlyPlayingBar";

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
    }),
  );

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const [orientation, setOrientation] = useState(
    ScreenOrientation.Orientation.PORTRAIT_UP,
  );

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);

    ScreenOrientation.getOrientationAsync().then((info) => {
      setOrientation(info);
    });

    // subscribe to future changes
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (evt) => {
        setOrientation(evt.orientationInfo.orientation);
      },
    );

    // return a clean up function to unsubscribe from notifications
    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <JotaiProvider>
        <JellyfinProvider>
          <StatusBar style="light" backgroundColor="#000" />
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
                  headerStyle: { backgroundColor: "black" },
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="(auth)/downloads"
                options={{
                  headerShown: true,
                  title: "Downloads",
                  headerStyle: { backgroundColor: "black" },
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="(auth)/items/[id]/page"
                options={{
                  title: "",
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(auth)/collections/[collection]/page"
                options={{
                  title: "",
                  headerShown: true,
                  headerStyle: { backgroundColor: "black" },
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="(auth)/series/[id]/page"
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
      </JotaiProvider>
    </QueryClientProvider>
  );
}
