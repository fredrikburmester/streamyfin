import { apiAtom } from "@/providers/JellyfinProvider";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { currentlyPlayingItemAtom, playingAtom } from "../CurrentlyPlayingBar";

export const WebSocketsTest = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  const [api] = useAtom(apiAtom);
  

  useEffect(() => {
    if (!api || !api.accessToken || !api.basePath) return;

    // Set up WebSocket connection
    const newWebSocket = new WebSocket(
      `wss://${api?.basePath
        .replace("https://", "")
        .replace("http://", "")}/socket?api_key=${api?.accessToken}&deviceId=${
        api?.deviceInfo.id
      }`
    );

    newWebSocket.onopen = () => {
      console.log("WebSocket connection established");
      // You can also send data once the connection is open
      newWebSocket.send(
        JSON.stringify({ type: "greeting", payload: "Hello from client!" })
      );
    };

    newWebSocket.onmessage = (e) => {};

    newWebSocket.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    newWebSocket.onclose = (e) => {
      console.log("WebSocket connection closed:", e.reason);
    };

    setWs(newWebSocket);

    // Clean up function
    return () => {
      newWebSocket.close();
    };
  }, [api]);

  return (
    <View>
      <Text>WebSocket Demo</Text>
    </View>
  );
};
