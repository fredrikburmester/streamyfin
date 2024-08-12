import { router, Tabs } from "expo-router";
import React, { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { Platform, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function TabLayout() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#121212");
      NavigationBar.setBorderColorAsync("#121212");
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabIconSelected,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "black" },
          headerShadowVisible: false,
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginHorizontal: 17 }}
              onPress={() => {
                router.push("/(auth)/downloads");
              }}
            >
              <Feather name="download" color={"white"} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{ marginHorizontal: 17 }}
              onPress={() => {
                router.push("/(auth)/settings");
              }}
            >
              <Feather name="settings" color={"white"} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerStyle: { backgroundColor: "black" },
          headerShown: true,
          headerShadowVisible: false,
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "search" : "search"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
