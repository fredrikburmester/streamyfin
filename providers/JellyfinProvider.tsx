import {
  currentlyPlayingItemAtom,
  playingAtom,
  showCurrentlyPlayingBarAtom,
} from "@/utils/atoms/playState";
import { Api, Jellyfin } from "@jellyfin/sdk";
import { UserDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useSegments } from "expo-router";
import { atom, useAtom } from "jotai";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import uuid from "react-native-uuid";

interface Server {
  address: string;
}

export const apiAtom = atom<Api | null>(null);
export const userAtom = atom<UserDto | null>(null);
export const wsAtom = atom<WebSocket | null>(null);

interface JellyfinContextValue {
  discoverServers: (url: string) => Promise<Server[]>;
  setServer: (server: Server) => Promise<void>;
  removeServer: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const JellyfinContext = createContext<JellyfinContextValue | undefined>(
  undefined
);

const getOrSetDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = uuid.v4() as string;
    await AsyncStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
};

export const JellyfinProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [jellyfin, setJellyfin] = useState<Jellyfin | undefined>(undefined);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const id = await getOrSetDeviceId();
      setJellyfin(
        () =>
          new Jellyfin({
            clientInfo: { name: "Streamyfin", version: "0.6.2" },
            deviceInfo: { name: Platform.OS === "ios" ? "iOS" : "Android", id },
          })
      );
      setDeviceId(id);
    })();
  }, []);

  const [api, setApi] = useAtom(apiAtom);
  const [user, setUser] = useAtom(userAtom);
  const [ws, setWs] = useAtom(wsAtom);

  useEffect(() => {
    if (!deviceId || !api) return;

    const url = `wss://${api?.basePath
      .replace("https://", "")
      .replace("http://", "")}/socket?api_key=${
      api?.accessToken
    }&deviceId=${deviceId}`;

    console.log("WS", url);

    const newWebSocket = new WebSocket(url);

    let keepAliveInterval: NodeJS.Timeout | null = null;

    newWebSocket.onopen = () => {
      setIsConnected(true);
      // Start sending "KeepAlive" message every 30 seconds
      keepAliveInterval = setInterval(() => {
        if (newWebSocket.readyState === WebSocket.OPEN) {
          newWebSocket.send(JSON.stringify({ MessageType: "KeepAlive" }));
          console.log("KeepAlive message sent");
        }
      }, 30000);
    };

    newWebSocket.onmessage = (e) => {
      const json = JSON.parse(e.data);
      const command = json?.Data?.Command;

      // On PlayPause
      if (command === "PlayPause") {
        console.log("Command ~ PlayPause");
      } else if (command === "Stop") {
        console.log("Command ~ Stop");
      }
    };

    newWebSocket.onerror = (e) => {
      console.error("WebSocket error:", e);
      setIsConnected(false);
    };

    newWebSocket.onclose = (e) => {
      console.log("WebSocket connection closed:", e.reason);
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };

    setWs(newWebSocket);

    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      newWebSocket.close();
    };
  }, [api, deviceId]);

  const discoverServers = async (url: string): Promise<Server[]> => {
    const servers = await jellyfin?.discovery.getRecommendedServerCandidates(
      url
    );
    return servers?.map((server) => ({ address: server.address })) || [];
  };

  const setServerMutation = useMutation({
    mutationFn: async (server: Server) => {
      const apiInstance = jellyfin?.createApi(server.address);

      if (!apiInstance?.basePath) throw new Error("Failed to connect");

      setApi(apiInstance);
      await AsyncStorage.setItem("serverUrl", server.address);
    },
    onError: (error) => {
      console.error("Failed to set server:", error);
    },
  });

  const removeServerMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem("serverUrl");
      setApi(null);
    },
    onError: (error) => {
      console.error("Failed to remove server:", error);
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      if (!api || !jellyfin) throw new Error("API not initialized");

      const auth = await api.authenticateUserByName(username, password);

      if (auth.data.AccessToken && auth.data.User) {
        setUser(auth.data.User);
        await AsyncStorage.setItem("user", JSON.stringify(auth.data.User));
        setApi(jellyfin.createApi(api?.basePath, auth.data?.AccessToken));
        await AsyncStorage.setItem("token", auth.data?.AccessToken);
      } else {
        throw new Error("Invalid username or password");
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem("token");
      setUser(null);
    },
    onError: (error) => {
      console.error("Logout failed:", error);
    },
  });

  const { isLoading, isFetching } = useQuery({
    queryKey: [
      "initializeJellyfin",
      user?.Id,
      api?.basePath,
      jellyfin?.clientInfo,
    ],
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const serverUrl = await AsyncStorage.getItem("serverUrl");
        const user = JSON.parse(
          (await AsyncStorage.getItem("user")) as string
        ) as UserDto;

        if (serverUrl && token && user.Id && jellyfin) {
          const apiInstance = jellyfin.createApi(serverUrl, token);
          setApi(apiInstance);
          setUser(user);
        }

        return true;
      } catch (e) {
        console.error(e);
      }
    },
    staleTime: 0,
    enabled: !user?.Id || !api || !jellyfin,
  });

  const contextValue: JellyfinContextValue = {
    discoverServers,
    setServer: (server) => setServerMutation.mutateAsync(server),
    removeServer: () => removeServerMutation.mutateAsync(),
    login: (username, password) =>
      loginMutation.mutateAsync({ username, password }),
    logout: () => logoutMutation.mutateAsync(),
  };

  useProtectedRoute(user, isLoading || isFetching);

  return (
    <JellyfinContext.Provider value={contextValue}>
      {children}
    </JellyfinContext.Provider>
  );
};

export const useJellyfin = (): JellyfinContextValue => {
  const context = useContext(JellyfinContext);
  if (!context)
    throw new Error("useJellyfin must be used within a JellyfinProvider");
  return context;
};

function useProtectedRoute(user: UserDto | null, loading = false) {
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user?.Id && inAuthGroup) {
      router.replace("/login");
    } else if (user?.Id && !inAuthGroup) {
      router.replace("/home");
    }
  }, [user, segments, loading]);
}
