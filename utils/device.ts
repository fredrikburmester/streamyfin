import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";

export const getOrSetDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = uuid.v4() as string;
    await AsyncStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
};

export const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem("deviceId");

  return deviceId || null;
};
