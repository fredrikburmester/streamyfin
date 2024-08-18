import { Api, Jellyfin } from "@jellyfin/sdk";
import { UserDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useMutation } from "@tanstack/react-query";
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
  let deviceId = null;

  if (!deviceId) {
    deviceId = uuid.v4() as string;
  }

  return deviceId;
};

export const JellyfinProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [jellyfin, setJellyfin] = useState<Jellyfin | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const id = await getOrSetDeviceId();
      setJellyfin(
        () =>
          new Jellyfin({
            clientInfo: { name: "Streamyfin", version: "0.6.1" },
            deviceInfo: { name: Platform.OS === "ios" ? "iOS" : "Android", id },
          })
      );
    })();
  }, []);

  const [api, setApi] = useAtom(apiAtom);
  const [user, setUser] = useAtom(userAtom);

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
    },
    onError: (error) => {
      console.error("Failed to set server:", error);
    },
  });

  const removeServerMutation = useMutation({
    mutationFn: async () => {
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
        setApi(jellyfin.createApi(api?.basePath, auth.data?.AccessToken));
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
      setUser(null);
    },
    onError: (error) => {
      console.error("Logout failed:", error);
    },
  });

  const contextValue: JellyfinContextValue = {
    discoverServers,
    setServer: (server) => setServerMutation.mutateAsync(server),
    removeServer: () => removeServerMutation.mutateAsync(),
    login: (username, password) =>
      loginMutation.mutateAsync({ username, password }),
    logout: () => logoutMutation.mutateAsync(),
  };

  useProtectedRoute(user);

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
