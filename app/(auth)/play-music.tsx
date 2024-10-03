import { FullScreenMusicPlayer } from "@/components/FullScreenMusicPlayer";
import { StatusBar } from "expo-status-bar";
import { View, ViewProps } from "react-native";

interface Props extends ViewProps {}

export default function page() {
  return (
    <View className="">
      <StatusBar hidden={false} />
      <FullScreenMusicPlayer />
    </View>
  );
}
