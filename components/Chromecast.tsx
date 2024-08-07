import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import React, { useEffect } from "react";
import { TouchableOpacity, View } from "react-native";
import {
  CastButton,
  useCastDevice,
  useDevices,
  useRemoteMediaClient,
} from "react-native-google-cast";
import GoogleCast from "react-native-google-cast";
import { Text } from "./common/Text";

type Props = {
  item?: BaseItemDto | null;
  startTimeTicks?: number | null;
};

export const Chromecast: React.FC<Props> = ({ item, startTimeTicks }) => {
  const client = useRemoteMediaClient();
  const castDevice = useCastDevice();
  const devices = useDevices();
  const sessionManager = GoogleCast.getSessionManager();
  const discoveryManager = GoogleCast.getDiscoveryManager();

  useEffect(() => {
    (async () => {
      if (!discoveryManager) {
        console.log("No discoveryManager client");
        return;
      }

      await discoveryManager.startDiscovery();

      const started = await discoveryManager.isRunning();

      console.log({
        devices,
        castDevice,
        sessionManager,
      });
    })();
  }, [client, devices, castDevice, sessionManager, discoveryManager]);

  const cast = () => {
    if (!client) {
      console.log("No chromecast client");
      return;
    }

    client.loadMedia({
      mediaInfo: {
        contentUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4",
        contentType: "video/mp4",
        metadata: {
          type: item?.Type === "Episode" ? "tvShow" : "movie",
          title: item?.Name || "",
          subtitle: item?.Overview || "",
        },
        streamDuration: Math.floor((item?.RunTimeTicks || 0) / 10000),
      },
      startTime: Math.floor((startTimeTicks || 0) / 10000),
    });
  };

  return <CastButton style={{ tintColor: "white", height: 48, width: 48 }} />;
};
