import { usePlayback } from "@/providers/PlaybackProvider";
import { runtimeTicksToMinutes } from "@/utils/time";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import CastContext, {
  PlayServicesState,
  useRemoteMediaClient,
} from "react-native-google-cast";
import { Button } from "./Button";
import { Text } from "./common/Text";
import { useAtom } from "jotai";
import { itemThemeColorAtom } from "@/utils/atoms/primaryColor";

interface Props extends React.ComponentProps<typeof Button> {
  item?: BaseItemDto | null;
  url?: string | null;
}

export const PlayButton: React.FC<Props> = ({ item, url, ...props }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const client = useRemoteMediaClient();
  const { setCurrentlyPlayingState } = usePlayback();

  const [color] = useAtom(itemThemeColorAtom);

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
    <TouchableOpacity onPress={onPress} className="relative" {...props}>
      <View
        style={{
          width:
            playbackPercent === 0
              ? "100%"
              : `${Math.max(playbackPercent, 15)}%`,
          height: "100%",
          backgroundColor: color.primary,
        }}
        className="absolute w-full h-full top-0 left-0 rounded-xl  z-10"
      ></View>
      <View
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: color.primary,
        }}
        className="absolute w-full h-full top-0 left-0 rounded-xl opacity-40"
      ></View>
      <View className="flex flex-row items-center justify-center bg-transparent rounded-xl z-20 h-12 w-full ">
        <View className="flex flex-row items-center space-x-2">
          <Text
            className="font-bold"
            style={{
              color: color.text,
            }}
          >
            {runtimeTicksToMinutes(item?.RunTimeTicks)}
          </Text>
          <Ionicons name="play-circle" size={24} color={color.text} />
          {client && <Feather name="cast" size={22} color={color.text} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};
