import { Button } from "@/components/Button";
import { Input } from "@/components/common/Input";
import { Text } from "@/components/common/Text";
import { apiAtom, useJellyfin } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { AxiosError } from "axios";
import { useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
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
  const { setServer, login, removeServer } = useJellyfin();
  const [api] = useAtom(apiAtom);
  const params = useLocalSearchParams();

  const {
    apiUrl: _apiUrl,
    username: _username,
    password: _password,
  } = params as { apiUrl: string; username: string; password: string };

  const [serverURL, setServerURL] = useState<string>(_apiUrl);
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

  const handleConnect = (url: string) => {
    if (!url.startsWith("http")) {
      Alert.alert("Error", "URL needs to start with http or https.");
      return;
    }
    setServer({ address: url.trim() });
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
                <Text className="text-3xl font-bold mb-2">Streamyfin</Text>
                <Text className="text-neutral-500 mb-2">
                  Server: {api.basePath}
                </Text>
                <Button
                  color="black"
                  onPress={() => {
                    removeServer();
                    setServerURL("");
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
                <Text className="text-neutral-500">
                  Log in to any user account
                </Text>
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

            <Button
              onPress={handleLogin}
              loading={loading}
              className="mt-auto mb-2"
            >
              Log in
            </Button>
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
            <Text className="opacity-30">
              Server URL requires http or https
            </Text>
          </View>
          <Button onPress={() => handleConnect(serverURL)} className="mb-2">
            Connect
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
