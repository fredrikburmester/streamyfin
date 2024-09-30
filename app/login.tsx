import { Button } from "@/components/Button";
import { Input } from "@/components/common/Input";
import { Text } from "@/components/common/Text";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { apiAtom, useJellyfin } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { PublicSystemInfo } from "@jellyfin/sdk/lib/generated-client";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api";
import { useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const { setServer, login, removeServer, initiateQuickConnect } =
    useJellyfin();
  const [api] = useAtom(apiAtom);
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
        await login(credentials.username, credentials.password);
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

    const protocols = ["https://", "http://"];
    const timeout = 2000; // 2 seconds timeout for long 404 responses

    try {
      for (const protocol of protocols) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(`${protocol}${url}/System/Info/Public`, {
            mode: "cors",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = (await response.json()) as PublicSystemInfo;
            setServerName(data.ServerName || "");
            return `${protocol}${url}`;
          }
        } catch (e) {
          const error = e as Error;
          if (error.name === "AbortError") {
            console.log(`Request to ${protocol}${url} timed out`);
          } else {
            console.error(`Error checking ${protocol}${url}:`, error);
          }
        }
      }
      return undefined;
    } finally {
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
          <View className="flex flex-col justify-between px-4 h-full gap-y-2">
            <View></View>
            <View>
              <View className="mb-4">
                <Text className="text-3xl font-bold mb-1">
                  {serverName || "Streamyfin"}
                </Text>
                <Text className="text-neutral-500 mb-2">
                  {t("server.server_label", { serverURL: api.basePath })}
                </Text>
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
                  {t("server.change_server")}
                </Button>
              </View>

              <View className="flex flex-col space-y-2">
                <Text className="text-2xl font-bold">{t("login.login")}</Text>
                <Input
                  placeholder={t("login.username_placeholder")}
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
                  placeholder={t("login.password_placeholder")}
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

            <View className="mt-auto mb-2">
              <Button
                color="black"
                onPress={handleQuickConnect}
                className="mb-2"
              >
                {t("login.use_quick_connect")}
              </Button>
              <Button onPress={handleLogin} loading={loading}>
              {t("login.login_button")}
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
        <View className="flex flex-col px-4 justify-between h-full">
          <View></View>
          <View className="flex flex-col gap-y-2">
            <Text className="text-3xl font-bold">Streamyfin</Text>
            <Text className="text-neutral-500">
              {t("server.connect_to_server")}
            </Text>
            <Input
              placeholder={t("server.server_url_placeholder")}
              onChangeText={setServerURL}
              value={serverURL}
              keyboardType="url"
              returnKeyType="done"
              autoCapitalize="none"
              textContentType="URL"
              maxLength={500}
            />
            <Text className="opacity-30">{t("server.server_url_hint")}</Text>
            <LanguageSwitcher />
          </View>
          <Button
            loading={loadingServerCheck}
            disabled={loadingServerCheck}
            onPress={async () => await handleConnect(serverURL)}
            className="mb-2"
          >
            {t("server.connect_button")}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
