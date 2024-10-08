import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

export const useAndroidNavigationBar = () => {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");

      return () => {
        NavigationBar.setVisibilityAsync("visible");
        NavigationBar.setBehaviorAsync("inset-swipe");
      };
    }
  }, []);
};
