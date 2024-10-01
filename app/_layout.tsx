import { DownloadProvider } from "@/providers/DownloadProvider";
import {
  getOrSetDeviceId,
  getTokenFromStoraage,
  JellyfinProvider,
} from "@/providers/JellyfinProvider";
import { JobQueueProvider } from "@/providers/JobQueueProvider";
import { PlaybackProvider } from "@/providers/PlaybackProvider";
import { orientationAtom } from "@/utils/atoms/orientation";
import { Settings, useSettings } from "@/utils/atoms/settings";
import { BACKGROUND_FETCH_TASK } from "@/utils/background-tasks";
import { cancelJobById, getAllJobsByDeviceId } from "@/utils/optimize-server";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import {
  checkForExistingDownloads,
  completeHandler,
  download,
} from "@kesha-antonov/react-native-background-downloader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as BackgroundFetch from "expo-background-fetch";
import * as FileSystem from "expo-file-system";
import { useFonts } from "expo-font";
import { useKeepAwake } from "expo-keep-awake";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
import { Provider as JotaiProvider, useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Toaster } from "sonner-native";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (url) {
        router.push(url);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response?.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log("TaskManager ~ trigger");

  const now = Date.now();

  const settingsData = await AsyncStorage.getItem("settings");

  if (!settingsData) return BackgroundFetch.BackgroundFetchResult.NoData;

  const settings: Partial<Settings> = JSON.parse(settingsData);
  const url = settings?.optimizedVersionsServerUrl;

  if (!settings?.autoDownload || !url)
    return BackgroundFetch.BackgroundFetchResult.NoData;

  const token = await getTokenFromStoraage();
  const deviceId = await getOrSetDeviceId();
  const baseDirectory = FileSystem.documentDirectory;

  if (!token || !deviceId || !baseDirectory)
    return BackgroundFetch.BackgroundFetchResult.NoData;

  console.log({
    token,
    url,
    deviceId,
  });

  const jobs = await getAllJobsByDeviceId({
    deviceId,
    authHeader: token,
    url,
  });

  console.log("TaskManager ~ Active jobs: ", jobs.length);

  for (let job of jobs) {
    if (job.status === "completed") {
      const downloadUrl = url + "download/" + job.id;
      console.log({
        token,
        deviceId,
        baseDirectory,
        url,
        downloadUrl,
      });

      const tasks = await checkForExistingDownloads();

      if (tasks.find((task) => task.id === job.id)) {
        console.log("TaskManager ~ Download already in progress: ", job.id);
        continue;
      }

      download({
        id: job.id,
        url: url + "download/" + job.id,
        destination: `${baseDirectory}${job.item.Id}.mp4`,
        headers: {
          Authorization: token,
        },
      })
        .begin(() => {
          console.log("TaskManager ~ Download started: ", job.id);
        })
        .done(() => {
          console.log("TaskManager ~ Download completed: ", job.id);
          saveDownloadedItemInfo(job.item);
          completeHandler(job.id);
          cancelJobById({
            authHeader: token,
            id: job.id,
            url: url,
          });
          Notifications.scheduleNotificationAsync({
            content: {
              title: job.item.Name,
              body: "Download completed",
              data: {
                url: `/downloads`,
              },
            },
            trigger: null,
          });
        })
        .error((error) => {
          console.log("TaskManager ~ Download error: ", job.id, error);
          completeHandler(job.id);
          Notifications.scheduleNotificationAsync({
            content: {
              title: job.item.Name,
              body: "Download failed",
              data: {
                url: `/downloads`,
              },
            },
            trigger: null,
          });
        });
    }
  }

  console.log(`Auto download started: ${new Date(now).toISOString()}`);

  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

const checkAndRequestPermissions = async () => {
  try {
    const hasAskedBefore = await AsyncStorage.getItem(
      "hasAskedForNotificationPermission"
    );

    if (hasAskedBefore !== "true") {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === "granted") {
        console.log("Notification permissions granted.");
      } else {
        console.log("Notification permissions denied.");
      }

      await AsyncStorage.setItem("hasAskedForNotificationPermission", "true");
    } else {
      console.log("Already asked for notification permissions before.");
    }
  } catch (error) {
    console.error("Error checking/requesting notification permissions:", error);
  }
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
  const [settings, updateSettings] = useSettings();
  const [orientation, setOrientation] = useAtom(orientationAtom);

  useKeepAwake();
  useNotificationObserver();

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
    checkAndRequestPermissions();
  }, []);

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
                          name="(auth)/play-music"
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

async function saveDownloadedItemInfo(item: BaseItemDto) {
  try {
    const downloadedItems = await AsyncStorage.getItem("downloadedItems");
    let items: BaseItemDto[] = downloadedItems
      ? JSON.parse(downloadedItems)
      : [];

    const existingItemIndex = items.findIndex((i) => i.Id === item.Id);
    if (existingItemIndex !== -1) {
      items[existingItemIndex] = item;
    } else {
      items.push(item);
    }

    await AsyncStorage.setItem("downloadedItems", JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save downloaded item information:", error);
  }
}
