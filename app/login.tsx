import { Button } from "@/components/Button";
import { Input } from "@/components/common/Input";
import { Text } from "@/components/common/Text";
import { apiAtom, useJellyfin } from "@/providers/JellyfinProvider";
import { writeToLog } from "@/utils/log";
import { Ionicons } from "@expo/vector-icons";
import { PublicSystemInfo } from "@jellyfin/sdk/lib/generated-client";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  View,
} from "react-native";

import { z } from "zod";

const CredentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

const Login: React.FC = () => {
  const { setServer, login, removeServer, initiateQuickConnect } =
    useJellyfin();
  const [api] = useAtom(apiAtom);
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    apiUrl: _apiUrl,
    username: _username,
    password: _password,
  } = params as { apiUrl: string; username: string; password: string };

  const [serverURL, setServerURL] = useState<string>(_apiUrl);
  const [serverName, setServerName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  }>({
    username: _username,
    password: _password,
  });

  useEffect(() => {
    (async () => {
      // we might re-use the checkUrl function here to check the url as well
      // however, I don't think it should be necessary for now
      if (_apiUrl) {
        setServer({
          address: _apiUrl,
        });

        setTimeout(() => {
          if (_username && _password) {
            setCredentials({ username: _username, password: _password });
            login(_username, _password);
          }
        }, 300);
      }
    })();
  }, [_apiUrl, _username, _password]);

  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = CredentialsSchema.safeParse(credentials);
      if (result.success) {
        try {
          await login(credentials.username, credentials.password);
        } catch (loginError) {
          if (loginError instanceof Error) {
            setError(loginError.message);
          } else {
            setError("An unexpected error occurred during login");
          }
        }
      } else {
        setError("Invalid credentials format");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const [loadingServerCheck, setLoadingServerCheck] = useState<boolean>(false);

  /**
   * Checks the availability and validity of a Jellyfin server URL.
   *
   * This function attempts to connect to a Jellyfin server using the provided URL.
   * It tries both HTTPS and HTTP protocols, with a timeout to handle long 404 responses.
   *
   * @param {string} url - The base URL of the Jellyfin server to check.
   * @returns {Promise<string | undefined>} A Promise that resolves to:
   *   - The full URL (including protocol) if a valid Jellyfin server is found.
   *   - undefined if no valid server is found at the given URL.
   *
   * Side effects:
   * - Sets loadingServerCheck state to true at the beginning and false at the end.
   * - Logs errors and timeout information to the console.
   */
  async function checkUrl(url: string) {
    url = url.endsWith("/") ? url.slice(0, -1) : url;
    setLoadingServerCheck(true);
    writeToLog("INFO", `Checking URL: ${url}`);

    const timeout = 5000; // 5 seconds timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Try HTTPS first
      const httpsUrl = `https://${url}/System/Info/Public`;
      try {
        const response = await fetch(httpsUrl, {
          mode: "cors",
          signal: controller.signal,
        });
        if (response.ok) {
          const data = (await response.json()) as PublicSystemInfo;
          setServerName(data.ServerName || "");
          return `https://${url}`;
        } else {
          writeToLog(
            "WARN",
            `HTTPS connection failed with status: ${response.status}`
          );
        }
      } catch (e) {
        writeToLog("WARN", "HTTPS connection failed - trying HTTP", e);
      }

      // If HTTPS didn't work, try HTTP
      const httpUrl = `http://${url}/System/Info/Public`;
      try {
        const response = await fetch(httpUrl, {
          mode: "cors",
          signal: controller.signal,
        });
        writeToLog("INFO", `HTTP response status: ${response.status}`);
        if (response.ok) {
          const data = (await response.json()) as PublicSystemInfo;
          setServerName(data.ServerName || "");
          return `http://${url}`;
        } else {
          writeToLog(
            "WARN",
            `HTTP connection failed with status: ${response.status}`
          );
        }
      } catch (e) {
        writeToLog("ERROR", "HTTP connection failed", e);
      }

      // If neither worked, return undefined
      writeToLog(
        "ERROR",
        `Failed to connect to ${url} using both HTTPS and HTTP`
      );
      return undefined;
    } catch (e) {
      const error = e as Error;
      if (error.name === "AbortError") {
        writeToLog("ERROR", `Request to ${url} timed out`, error);
      } else {
        writeToLog("ERROR", `Unexpected error checking ${url}`, error);
      }
      return undefined;
    } finally {
      clearTimeout(timeoutId);
      setLoadingServerCheck(false);
    }
  }

  /**
   * Handles the connection attempt to a Jellyfin server.
   *
   * This function trims the input URL, checks its validity using the `checkUrl` function,
   * and sets the server address if a valid connection is established.
   *
   * @param {string} url - The URL of the Jellyfin server to connect to.
   *
   * @returns {Promise<void>}
   *
   * Side effects:
   * - Calls `checkUrl` to validate the server URL.
   * - Shows an alert if the connection fails.
   * - Sets the server address using `setServer` if the connection is successful.
   *
   */
  const handleConnect = async (url: string) => {
    url = url.trim();

    const result = await checkUrl(
      url.startsWith("http") ? new URL(url).host : url
    );

    if (result === undefined) {
      Alert.alert(
        "Connection failed",
        "Could not connect to the server. Please check the URL and your network connection."
      );
      return;
    }

    setServer({ address: result });
  };

  const handleQuickConnect = async () => {
    try {
      const code = await initiateQuickConnect();
      if (code) {
        Alert.alert("Quick Connect", `Enter code ${code} to login`, [
          {
            text: "Got It",
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to initiate Quick Connect");
    }
  };

  if (api?.basePath) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, height: "100%" }}
        >
          <View className="flex flex-col w-full h-full relative items-center justify-center">
            <View className="absolute top-4 right-4">
              <Ionicons
                name="file-tray-full-outline"
                size={22}
                color="white"
                onPress={() => {
                  router.push("/logs");
                }}
              />
            </View>
            <View className="px-4 -mt-20">
              <View className="mb-4">
                <Text className="text-3xl font-bold mb-1">
                  {serverName || "Streamyfin"}
                </Text>
                <View className="bg-neutral-900 rounded-xl p-4 mb-2 flex flex-row items-center justify-between">
                  <Text className="">URL</Text>
                  <Text numberOfLines={1} className="shrink">
                    {api.basePath}
                  </Text>
                </View>
                <Button
                  color="black"
                  onPress={() => {
                    removeServer();
                  }}
                  justify="between"
                  iconLeft={
                    <Ionicons
                      name="arrow-back-outline"
                      size={18}
                      color={"white"}
                    />
                  }
                >
                  Change server
                </Button>
              </View>

              <View className="flex flex-col space-y-2">
                <Text className="text-2xl font-bold">Log in</Text>
                <Input
                  placeholder="Username"
                  onChangeText={(text) =>
                    setCredentials({ ...credentials, username: text })
                  }
                  value={credentials.username}
                  autoFocus
                  secureTextEntry={false}
                  keyboardType="default"
                  returnKeyType="done"
                  autoCapitalize="none"
                  textContentType="username"
                  clearButtonMode="while-editing"
                  maxLength={500}
                />

                <Input
                  className="mb-2"
                  placeholder="Password"
                  onChangeText={(text) =>
                    setCredentials({ ...credentials, password: text })
                  }
                  value={credentials.password}
                  secureTextEntry
                  keyboardType="default"
                  returnKeyType="done"
                  autoCapitalize="none"
                  textContentType="password"
                  clearButtonMode="while-editing"
                  maxLength={500}
                />
              </View>

              <Text className="text-red-600 mb-2">{error}</Text>
            </View>

            <View className="absolute bottom-0 left-0 w-full px-4 mb-2">
              <Button
                color="black"
                onPress={handleQuickConnect}
                className="w-full mb-2"
              >
                Use Quick Connect
              </Button>
              <Button onPress={handleLogin} loading={loading}>
                Log in
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex flex-col h-full relative items-center justify-center w-full">
          <View className="flex flex-col gap-y-2 px-4 w-full -mt-36">
            <Image
              style={{
                width: 100,
                height: 100,
                marginLeft: -23,
                marginBottom: -20,
              }}
              source={require("@/assets/images/StreamyFinFinal.png")}
            />
            <Text className="text-3xl font-bold">Streamyfin</Text>
            <Text className="text-neutral-500">
              Connect to your Jellyfin server
            </Text>
            <Input
              placeholder="Server URL"
              onChangeText={setServerURL}
              value={serverURL}
              keyboardType="url"
              returnKeyType="done"
              autoCapitalize="none"
              textContentType="URL"
              maxLength={500}
            />
          </View>
          <View className="mb-2 absolute bottom-0 left-0 w-full px-4">
            <Button
              loading={loadingServerCheck}
              disabled={loadingServerCheck}
              onPress={async () => await handleConnect(serverURL)}
              className="w-full grow"
            >
              Connect
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
