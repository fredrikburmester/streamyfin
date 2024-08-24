import { usePlayback } from "@/providers/PlaybackProvider";
import { runtimeTicksToMinutes } from "@/utils/time";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { View } from "react-native";
import CastContext, {
  PlayServicesState,
  useRemoteMediaClient,
} from "react-native-google-cast";
import { Button } from "./Button";
import { isCancel } from "axios";

interface Props extends React.ComponentProps<typeof Button> {
  item?: BaseItemDto | null;
  url?: string | null;
}

export const PlayButton: React.FC<Props> = ({ item, url, ...props }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const client = useRemoteMediaClient();
  const { setCurrentlyPlayingState, isPlaying, currentlyPlaying } = usePlayback();

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
        const isOpeningCurrentlyPlayingMedia = isPlaying 
          && currentlyPlaying?.item?.Name 
          && currentlyPlaying?.item?.Name === item?.Name
        switch (selectedIndex) {
          case 0:
            await CastContext.getPlayServicesState().then((state) => {
              if (state && state !== PlayServicesState.SUCCESS)
                CastContext.showPlayServicesErrorDialog(state);
              else {
                // If we're opening a currently playing item, don't restart the media.
                // Instead just open controls
                console.log({ isOpeningCurrentlyPlayingMedia, currentlyPlaying })
                if (isOpeningCurrentlyPlayingMedia) {
                  CastContext.showExpandedControls();
                  return;
                }
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
                }).then(() => {
                  if (isOpeningCurrentlyPlayingMedia) {
                    return
                  }
                  setCurrentlyPlayingState({ item, url });
                  CastContext.showExpandedControls();
                }).catch(e => {
                  console.log({ e })
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

  return (
    <Button
      onPress={onPress}
      iconRight={
        <View className="flex flex-row items-center space-x-2">
          <Ionicons name="play-circle" size={24} color="white" />
          {client && <Feather name="cast" size={22} color="white" />}
        </View>
      }
      {...props}
    >
      {runtimeTicksToMinutes(item?.RunTimeTicks)}
    </Button>
  );
};
