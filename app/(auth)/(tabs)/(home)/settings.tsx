import { Button } from "@/components/Button";
import { Text } from "@/components/common/Text";
import { ListItem } from "@/components/ListItem";
import { SettingToggles } from "@/components/settings/SettingToggles";
import { useFiles } from "@/hooks/useFiles";
import { apiAtom, useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import { clearLogs, readFromLog } from "@/utils/log";
import { Ionicons } from "@expo/vector-icons";
import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAtom } from "jotai";
import { Alert, ScrollView, View } from "react-native";
import { red } from "react-native-reanimated/lib/typescript/reanimated2/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

export default function settings() {
  const { logout } = useJellyfin();
  const { deleteAllFiles } = useFiles();
  const { t } = useTranslation();

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
            console.log(res.status, res.statusText, res.data);
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

  return (
    <ScrollView
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: 100,
      }}
    >
      <View className="p-4 flex flex-col gap-y-4">
        <View>
          <Text className="font-bold text-lg mb-2">{t("settings.information")}</Text>

          <View className="flex flex-col rounded-xl overflow-hidden border-neutral-800 divide-y-2 divide-solid divide-neutral-800 ">
            <ListItem title={t("settings.user")} subTitle={user?.Name} />
            <ListItem title={t("settings.server")} subTitle={api?.basePath} />
          </View>
        </View>

        <View>
          <Text className="font-bold text-lg mb-2">{t("settings.quick_connect")}</Text>
          <Button onPress={openQuickConnectAuthCodeInput} color="black">
           {t("settings.authorize")}
          </Button>
        </View>

        <SettingToggles />

        <View>
          <Text className="font-bold text-lg mb-2">{t("settings.tests")}</Text>
          <Button
            onPress={() => {""
              toast.success(t("toasts.download_started"));
            }}
            color="black"
          >
            {t("settings.test_toast")}
          </Button>
        </View>

        <View>
          <Text className="font-bold text-lg mb-2">{t("settings.account_and_storage")}</Text>
          <View className="flex flex-col space-y-2">
            <Button color="black" onPress={logout}>
              {t("settings.log_out")}
            </Button>
            <Button
              color="red"
              onPress={async () => {
                await deleteAllFiles();
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }}
            >
              {t("settings.delete_all_downloaded_files")}
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
              {t("settings.delete_all_logs")}
            </Button>
          </View>
        </View>
        <View>
          <Text className="font-bold text-lg mb-2">{t("settings.logs")}</Text>
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
                <Text className="text-xs">{log.message}</Text>
              </View>
            ))}
            {logs?.length === 0 && (
              <Text className="opacity-50">{t("settings.no_logs_available")}</Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
