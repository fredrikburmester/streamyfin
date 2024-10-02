import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { BlurView } from "expo-blur";
import * as NavigationBar from "expo-navigation-bar";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";

export default function TabLayout() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#121212");
      NavigationBar.setBorderColorAsync("#121212");
    }
  }, []);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: Colors.tabIconSelected,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: Platform.OS === "android" ? 8 : 26,
          height: Platform.OS === "android" ? 58 : 74,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              experimentalBlurMethod="dimezisBlurView"
              intensity={95}
              style={{
                ...StyleSheet.absoluteFillObject,
                overflow: "hidden",
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                backgroundColor: "black",
              }}
            />
          ) : undefined,
      }}
    >
      <Tabs.Screen redirect name="index" />
      <Tabs.Screen
        name="(home)"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          headerShown: false,
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "search" : "search"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(libraries)"
        options={{
          headerShown: false,
          title: "Library",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "apps" : "apps-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
