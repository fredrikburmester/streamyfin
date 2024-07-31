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

export const JellyfinProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [jellyfin] = useState(
    () =>
      new Jellyfin({
        clientInfo: { name: "My Client Application", version: "1.0.0" },
        deviceInfo: { name: "Device Name", id: "unique-device-id" },
      })
  );

  const [api, setApi] = useAtom(apiAtom);
  const [user, setUser] = useAtom(userAtom);

  const discoverServers = async (url: string): Promise<Server[]> => {
    const servers = await jellyfin.discovery.getRecommendedServerCandidates(
      url
    );
    return servers.map((server) => ({ address: server.address }));
  };

  const setServerMutation = useMutation({
    mutationFn: async (server: Server) => {
      const apiInstance = jellyfin.createApi(server.address);
      if (!apiInstance.basePath) throw new Error("Failed to connect");
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
      if (!api) throw new Error("API not initialized");

      const auth = await api.authenticateUserByName(username, password);

      if (!auth.data.User) {
        console.info("Failed to authenticate user");
        return;
      }

      setUser(auth.data.User);
      await AsyncStorage.setItem("user", JSON.stringify(auth.data.User));

      if (auth.data.AccessToken) {
        setApi(jellyfin.createApi(api?.basePath, auth.data?.AccessToken));
        await AsyncStorage.setItem("token", auth.data?.AccessToken);
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      setUser(null);
      await AsyncStorage.removeItem("token");
      if (api) await api.logout();
    },
    onError: (error) => {
      console.error("Logout failed:", error);
    },
  });

  const { isLoading, isFetching } = useQuery({
    queryKey: ["initializeJellyfin"],
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const serverUrl = await AsyncStorage.getItem("serverUrl");
        const user = JSON.parse(
          (await AsyncStorage.getItem("user")) as string
        ) as UserDto;

        if (serverUrl && token && user.Id) {
          const apiInstance = jellyfin.createApi(serverUrl, token);
          setApi(apiInstance);
          setUser(user);
        }

        return true;
      } catch (e) {
        console.error(e);
      }
    },
    staleTime: Infinity,
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

function useProtectedRoute(user: UserDto | null, isLoading: boolean) {
  const segments = useSegments();
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inLoginGroup = segments[0] === "(public)";
    if (!user?.Id && inAuthGroup) {
      router.replace("/login");
    } else if (user?.Id && inLoginGroup) {
      router.replace("/");
    }
  }, [user, segments]);
}
