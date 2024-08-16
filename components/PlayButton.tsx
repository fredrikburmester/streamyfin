import { Button } from "./Button";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Feather, Ionicons } from "@expo/vector-icons";
import { runtimeTicksToMinutes } from "@/utils/time";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { View } from "react-native";
import { useAtom } from "jotai";
import { playingAtom } from "./CurrentlyPlayingBar";

interface Props extends React.ComponentProps<typeof Button> {
  item: BaseItemDto;
  onPress: (type?: "cast" | "device") => void;
  chromecastReady: boolean;
}

export const PlayButton: React.FC<Props> = ({
  item,
  onPress,
  chromecastReady,
  ...props
}) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const _onPress = () => {
    if (!chromecastReady) {
      onPress("device");
      return;
    }

    const options = ["Chromecast", "Device", "Cancel"];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (selectedIndex: number | undefined) => {
        switch (selectedIndex) {
          case 0:
            onPress("cast");
            break;
          case 1:
            onPress("device");
            break;
          case cancelButtonIndex:
            console.log("calcel");
        }
      },
    );
  };

  return (
    <Button
      onPress={_onPress}
      iconRight={
        <View className="flex flex-row items-center space-x-2">
          <Ionicons name="play-circle" size={24} color="white" />
          {chromecastReady && <Feather name="cast" size={22} color="white" />}
        </View>
      }
      {...props}
    >
      {runtimeTicksToMinutes(item?.RunTimeTicks)}
    </Button>
  );
};
