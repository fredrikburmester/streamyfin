import { Button } from "@/components/Button";
import { Input } from "@/components/common/Input";
import { Text } from "@/components/common/Text";
import { apiAtom, useJellyfin } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { useAtom } from "jotai";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";

import { z } from "zod";

const CredentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const Login: React.FC = () => {
  const { setServer, login, removeServer } = useJellyfin();
  const [api] = useAtom(apiAtom);

  const [serverURL, setServerURL] = useState<string>("");
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  }>({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = CredentialsSchema.safeParse(credentials);
      if (result.success) {
        await login(credentials.username, credentials.password);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const parsedServerURL = useMemo(() => {
    let parsedServerURL = serverURL.trim();

    if (parsedServerURL) {
      parsedServerURL = parsedServerURL.endsWith("/")
        ? parsedServerURL.replace("/", "")
        : parsedServerURL;
      parsedServerURL = parsedServerURL.startsWith("http")
        ? parsedServerURL
        : "http://" + parsedServerURL;

      return parsedServerURL;
    }

    return "";
  }, [serverURL]);

  const handleConnect = (url: string) => {
    setServer({ address: url });
  };

  if (api?.basePath) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex flex-col px-4 justify-center h-full gap-y-2">
          <View>
            <Text className="text-3xl font-bold">Jellyfin</Text>
            <Text className="opacity-50 mb-2">Server: {api.basePath}</Text>
            <Button
              color="black"
              onPress={() => {
                removeServer();
                setServerURL("");
              }}
              justify="between"
              iconLeft={
                <Ionicons name="arrow-back-outline" size={18} color={"white"} />
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

          <Button onPress={handleLogin} loading={loading}>
            Log in
          </Button>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View className="flex flex-col px-4 justify-center h-full">
        <View className="flex flex-col gap-y-2">
          <Text className="text-3xl font-bold">Jellyfin</Text>
          <Text className="opacity-50">Enter a server adress</Text>
          <Input
            className="mb-2"
            placeholder="http(s)://..."
            onChangeText={setServerURL}
            value={serverURL}
            autoFocus
            secureTextEntry={false}
            keyboardType="url"
            returnKeyType="done"
            autoCapitalize="none"
            textContentType="URL"
            maxLength={500}
          />
          <Button onPress={() => handleConnect(parsedServerURL)}>
            Connect
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login;
