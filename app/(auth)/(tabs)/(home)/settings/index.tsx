import { Button } from "@/components/Button";
import { Text } from "@/components/common/Text";
import { ListInputItem } from "@/components/list/ListInputItem";
import { ListItem } from "@/components/list/ListItem";
import { ListSection } from "@/components/list/ListSection";
import { SettingToggles } from "@/components/settings/SettingToggles";
import { useDownload } from "@/providers/DownloadProvider";
import { apiAtom, useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { clearLogs, readFromLog } from "@/utils/log";
import { Ionicons } from "@expo/vector-icons";
import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function settings() {
  const { logout } = useJellyfin();
  const { deleteAllFiles } = useDownload();
  const [settings, updateSettings] = useSettings();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: logs } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => readFromLog(),
    refetchInterval: 1000,
  });

  const insets = useSafeAreaInsets();

  const openQuickConnectAuthCodeInput = () => {
    Alert.prompt(
      "Quick connect",
      "Enter the quick connect code",
      async (text) => {
        if (text) {
          try {
            const res = await getQuickConnectApi(api!).authorizeQuickConnect({
              code: text,
              userId: user?.Id,
            });
            if (res.status === 200) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Success", "Quick connect authorized");
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", "Invalid code");
            }
          } catch (e) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Invalid code");
          }
        }
      }
    );
  };

  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: 100,
      }}
    >
      <View className="p-4 flex flex-col gap-y-4">
        {/* <Button
          onPress={() => {
            registerBackgroundFetchAsync();
          }}
        >
          registerBackgroundFetchAsync
        </Button> */}
        <ListSection title="USER INFO">
          <ListItem title="User" text={user?.Name} />
          <ListItem title="Server" text={api?.basePath} />
          <ListItem title="Token" text={api?.accessToken} />
        </ListSection>

        <ListSection title="MEDIA">
          <ListItem
            title="Audio language"
            iconAfter={
              <Ionicons name="chevron-forward" size={20} color="white" />
            }
            onPress={() => router.push("/settings/audio-language")}
          />
          <ListItem
            title="Subtitle language"
            iconAfter={
              <Ionicons name="chevron-forward" size={20} color="white" />
            }
            onPress={() => router.push("/settings/subtitle-language")}
          />
          <ListInputItem
            textInputProps={{
              placeholder: "30",
              clearButtonMode: "never",
              returnKeyType: "done",
            }}
            defaultValue={(settings?.forwardSkipTime || "").toString()}
            title={"Forward skip"}
            onChange={(val) => {
              // 1. validate positive number
              // 2. save settings
              if (val.length === 0) return;
              if (val.match(/^\d+$/)) {
              } else {
                toast.error("Invalid number");
              }
            }}
          />
        </ListSection>

        <View>
          <Text className="font-bold text-lg mb-2">Quick connect</Text>
          <Button onPress={openQuickConnectAuthCodeInput} color="black">
            Authorize
          </Button>
        </View>

        <SettingToggles />

        <View>
          <Text className="font-bold text-lg mb-2">Account and storage</Text>
          <View className="flex flex-col space-y-2">
            <Button color="black" onPress={logout}>
              Log out
            </Button>
            <Button
              color="red"
              onPress={async () => {
                try {
                  await deleteAllFiles();
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                } catch (e) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Error
                  );
                  toast.error("Error deleting files");
                }
              }}
            >
              Delete all downloaded files
            </Button>
            <Button
              color="red"
              onPress={async () => {
                await clearLogs();
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }}
            >
              Delete all logs
            </Button>
          </View>
        </View>
        <View>
          <Text className="font-bold text-lg mb-2">Logs</Text>
          <View className="flex flex-col space-y-2">
            {logs?.map((log, index) => (
              <View key={index} className="bg-neutral-900 rounded-xl p-3">
                <Text
                  className={`
                  mb-1
              ${log.level === "INFO" && "text-blue-500"}
              ${log.level === "ERROR" && "text-red-500"}
                `}
                >
                  {log.level}
                </Text>
                <Text uiTextView selectable className="text-xs">
                  {log.message}
                </Text>
              </View>
            ))}
            {logs?.length === 0 && (
              <Text className="opacity-50">No logs available</Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
