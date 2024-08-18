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
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { currentlyPlayingItemAtom, playingAtom } from "../CurrentlyPlayingBar";
import { useActionSheet } from "@expo/react-native-action-sheet";
import ios from "@/utils/profiles/ios";

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
  const [, setCp] = useAtom(currentlyPlayingItemAtom);
  const [, setPlaying] = useAtom(playingAtom);

  const { showActionSheetWithOptions } = useActionSheet();

  const openSelect = () => {
    play("device");
    return;
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
      deviceProfile: ios,
    });

    if (!url || !item) return;

    setCp({
      item,
      playbackUrl: url,
    });
    setPlaying(true);
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
