import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type {
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();

export const Tab = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

const Layout = () => {
  return (
    <Tab
      initialRouteName="programs"
      keyboardDismissMode="none"
      screenOptions={{
        tabBarLabelStyle: { fontSize: 10 },
        tabBarItemStyle: {
          width: 100,
        },
        tabBarStyle: { backgroundColor: "black" },
        animationEnabled: true,
        lazy: true,
        swipeEnabled: true,
        tabBarIndicatorStyle: { backgroundColor: "#9334E9" },
        tabBarScrollEnabled: true,
      }}
    >
      <Tab.Screen name="programs" />
      <Tab.Screen name="guide" />
      <Tab.Screen name="channels" />
      <Tab.Screen name="recordings" />
    </Tab>
  );
};

export default Layout;
