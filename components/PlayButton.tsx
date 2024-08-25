import { usePlayback } from "@/providers/PlaybackProvider";
import { runtimeTicksToMinutes } from "@/utils/time";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  BaseItemDto,
  PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client/models";
import { View } from "react-native";
import CastContext, {
  PlayServicesState,
  useRemoteMediaClient,
} from "react-native-google-cast";
import { Button } from "./Button";
import { Text } from "./common/Text";
import { useMemo } from "react";

interface Props extends React.ComponentProps<typeof Button> {
  item?: BaseItemDto | null;
  url?: string | null;
}

export const PlayButton: React.FC<Props> = ({ item, url, ...props }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const client = useRemoteMediaClient();
  const { setCurrentlyPlayingState } = usePlayback();

  const onPress = async () => {
    if (!url || !item) return;

    if (!client) {
      setCurrentlyPlayingState({ item, url });
      return;
    }

    const options = ["Chromecast", "Device", "Cancel"];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (selectedIndex: number | undefined) => {
        switch (selectedIndex) {
          case 0:
            await CastContext.getPlayServicesState().then((state) => {
              if (state && state !== PlayServicesState.SUCCESS)
                CastContext.showPlayServicesErrorDialog(state);
              else {
                client.loadMedia({
                  mediaInfo: {
                    contentUrl: url,
                    contentType: "video/mp4",
                    metadata: {
                      type: item.Type === "Episode" ? "tvShow" : "movie",
                      title: item.Name || "",
                      subtitle: item.Overview || "",
                    },
                  },
                  startTime: 0,
                });
              }
            });
            break;
          case 1:
            setCurrentlyPlayingState({ item, url });
            break;
          case cancelButtonIndex:
            break;
        }
      }
    );
  };

  const playbackPercent = useMemo(() => {
    if (!item || !item.RunTimeTicks) return 0;
    const userData = item.UserData;
    if (!userData) return 0;
    const PlaybackPositionTicks = userData.PlaybackPositionTicks;
    if (!PlaybackPositionTicks) return 0;
    return (PlaybackPositionTicks / item.RunTimeTicks) * 100;
  }, [item]);

  return (
    <View className="relative">
      <View
        style={{
          width:
            playbackPercent === 0
              ? "100%"
              : `${Math.max(playbackPercent, 15)}%`,
          height: "100%",
        }}
        className="absolute w-full h-full top-0 left-0 rounded-xl bg-purple-600 z-10"
      ></View>
      <View
        style={{
          height: "100%",
          width: "100%",
        }}
        className="absolute w-full h-full top-0 left-0 rounded-xl bg-purple-500 opacity-40"
      ></View>
      <View className="absolute top-0 left-0 w-full h-full flex flex-row items-center justify-center bg-transparent rounded-xl z-10">
        <View className="flex flex-row items-center space-x-2">
          <Text className="font-bold">
            {runtimeTicksToMinutes(item?.RunTimeTicks)}
          </Text>
          <Ionicons name="play-circle" size={24} color="white" />
          {client && <Feather name="cast" size={22} color="white" />}
        </View>
      </View>
      <Button onPress={onPress} {...props} color="transparent"></Button>
    </View>
  );
};
