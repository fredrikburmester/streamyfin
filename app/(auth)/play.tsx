import { FullScreenVideoPlayer } from "@/components/FullScreenVideoPlayer";
import { useSettings } from "@/utils/atoms/settings";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, View, ViewProps } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

interface Props extends ViewProps {}

export default function page() {
  const [settings] = useSettings();

  useEffect(() => {
    if (settings?.autoRotate) {
      // Don't need to do anything
    } else if (settings?.defaultVideoOrientation) {
      ScreenOrientation.lockAsync(settings.defaultVideoOrientation);
    }

    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }

    return () => {
      if (settings?.autoRotate) {
        ScreenOrientation.unlockAsync();
      } else {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      }

      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible");
        NavigationBar.setBehaviorAsync("inset-swipe");
      }
    };
  }, [settings]);

  return (
    <View className="">
      <StatusBar hidden />
      <FullScreenVideoPlayer />
    </View>
  );
}
