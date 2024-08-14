import { router, Tabs } from "expo-router";
import React, { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { Platform, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Chromecast } from "@/components/Chromecast";

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
              <Feather name="download" color={"white"} size={22} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex flex-row items-center space-x-2">
              <Chromecast />
              <TouchableOpacity
                style={{ marginRight: 17 }}
                onPress={() => {
                  router.push("/(auth)/settings");
                }}
              >
                <View className="h-10 aspect-square flex items-center justify-center rounded">
                  <Feather name="settings" color={"white"} size={22} />
                </View>
              </TouchableOpacity>
            </View>
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
