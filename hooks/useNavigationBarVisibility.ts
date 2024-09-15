// hooks/useNavigationBarVisibility.ts

import { useEffect } from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

export const useNavigationBarVisibility = (isPlaying: boolean | null) => {
  useEffect(() => {
    const handleVisibility = async () => {
      if (Platform.OS === "android") {
        if (isPlaying) {
          await NavigationBar.setVisibilityAsync("hidden");
        } else {
          await NavigationBar.setVisibilityAsync("visible");
        }
      }
    };

    handleVisibility();

    return () => {
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible");
      }
    };
  }, [isPlaying]);
};
