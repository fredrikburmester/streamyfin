import { BlurView } from "expo-blur";
import React, { useEffect } from "react";
import { View, ViewProps } from "react-native";
import GoogleCast, {
  CastButton,
  useCastDevice,
  useDevices,
  useRemoteMediaClient,
} from "react-native-google-cast";

interface Props extends ViewProps {
  width?: number;
  height?: number;
  background?: "blur" | "transparent";
}

export const Chromecast: React.FC<Props> = ({
  width = 48,
  height = 48,
  background = "transparent",
  ...props
}) => {
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

  if (background === "transparent")
    return (
      <View
        className=" rounded h-10 aspect-square flex items-center justify-center"
        {...props}
      >
        <CastButton style={{ tintColor: "white", height, width }} />
      </View>
    );

  return (
    <BlurView
      intensity={100}
      className="rounded-full overflow-hidden h-10 aspect-square flex items-center justify-center"
      {...props}
    >
      <CastButton style={{ tintColor: "white", height, width }} />
    </BlurView>
  );
};
