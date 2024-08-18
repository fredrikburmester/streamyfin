import { Button } from "@/components/Button";
import { Text } from "@/components/common/Text";
import { ListItem } from "@/components/ListItem";
import { apiAtom, useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import { clearLogs, readFromLog } from "@/utils/log";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { ScrollView, View } from "react-native";
import * as Haptics from "expo-haptics";
import { SettingToggles } from "@/components/settings/SettingToggles";

export default function settings() {
  const { logout } = useJellyfin();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: logs } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => readFromLog(),
    refetchInterval: 1000,
  });

  return (
    <ScrollView>
      <View className="p-4 flex flex-col gap-y-4 pb-12">
        <Text className="font-bold text-2xl">Information</Text>

        <View className="flex flex-col rounded-xl mb-4 overflow-hidden border-neutral-800 divide-y-2 divide-solid divide-neutral-800 ">
          <ListItem title="User" subTitle={user?.Name} />
          <ListItem title="Server" subTitle={api?.basePath} />
        </View>

        <SettingToggles />

        <View className="flex flex-col space-y-2">
          <Button color="black" onPress={logout}>
            Log out
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

        <Text className="font-bold text-2xl">Logs</Text>
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
            <Text className="opacity-50">No logs available</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
