import {
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
} from "react-native";
import { Text } from "@/components/common/Text";
import index from "@/app/(auth)/(tabs)/home";
import { runtimeTicksToSeconds } from "@/utils/time";
import { router } from "expo-router";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getStreamUrl } from "@/utils/jellyfin/media/getStreamUrl";
import { useAtom } from "jotai";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { chromecastProfile } from "@/utils/profiles/chromecast";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import CastContext, {
  PlayServicesState,
  useCastDevice,
  useRemoteMediaClient,
} from "react-native-google-cast";
import ios12 from "@/utils/profiles/ios12";
import {
  currentlyPlayingItemAtom,
  triggerPlayAtom,
} from "../CurrentlyPlayingBar";
import { useActionSheet } from "@expo/react-native-action-sheet";

interface Props extends TouchableOpacityProps {
  collectionId: string;
  artistId: string;
  albumId: string;
  item: BaseItemDto;
  index: number;
}

export const SongsListItem: React.FC<Props> = ({
  collectionId,
  artistId,
  albumId,
  item,
  index,
  ...props
}) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const castDevice = useCastDevice();
  const [, setCp] = useAtom(currentlyPlayingItemAtom);
  const [, setPlayTrigger] = useAtom(triggerPlayAtom);

  const client = useRemoteMediaClient();
  const { showActionSheetWithOptions } = useActionSheet();

  const openSelect = () => {
    if (!castDevice?.deviceId) {
      play("device");
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
            play("cast");
            break;
          case 1:
            play("device");
            break;
          case cancelButtonIndex:
            console.log("calcel");
        }
      },
    );
  };

  const play = async (type: "device" | "cast") => {
    if (!user?.Id || !api || !item.Id) return;

    const response = await getMediaInfoApi(api!).getPlaybackInfo({
      itemId: item?.Id,
      userId: user?.Id,
    });

    const sessionData = response.data;

    const url = await getStreamUrl({
      api,
      userId: user.Id,
      item,
      startTimeTicks: item?.UserData?.PlaybackPositionTicks || 0,
      sessionData,
      deviceProfile: castDevice?.deviceId ? chromecastProfile : ios12,
    });

    if (!url || !item) return;

    if (type === "cast" && client) {
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
    } else {
      setCp({
        item,
        playbackUrl: url,
      });

      // Use this trigger to initiate playback in another component (CurrentlyPlayingBar)
      setPlayTrigger((prev) => prev + 1);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        openSelect();
      }}
      {...props}
    >
      <View className="flex flex-row items-center space-x-4 bg-neutral-900 border-neutral-800 px-4 py-4 rounded-xl">
        <Text className="opacity-50">{index + 1}</Text>
        <View>
          <Text className="mb-0.5 font-semibold">{item.Name}</Text>
          <Text className="opacity-50 text-xs">
            {runtimeTicksToSeconds(item.RunTimeTicks)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
