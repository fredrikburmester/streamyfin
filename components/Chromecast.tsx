import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import React, { useEffect } from "react";
import { View } from "react-native";
import {
  CastButton,
  useCastDevice,
  useDevices,
  useRemoteMediaClient,
} from "react-native-google-cast";
import GoogleCast from "react-native-google-cast";

type Props = {
  item?: BaseItemDto | null;
  startTimeTicks?: number | null;
};

export const Chromecast: React.FC<Props> = () => {
  const client = useRemoteMediaClient();
  const castDevice = useCastDevice();
  const devices = useDevices();
  const sessionManager = GoogleCast.getSessionManager();
  const discoveryManager = GoogleCast.getDiscoveryManager();

  useEffect(() => {
    (async () => {
      if (!discoveryManager) {
        return;
      }

      await discoveryManager.startDiscovery();
    })();
  }, [client, devices, castDevice, sessionManager, discoveryManager]);

  return (
    <View className="rounded h-12 aspect-square flex items-center justify-center">
      <CastButton style={{ tintColor: "white", height: 48, width: 48 }} />
    </View>
  );
};
