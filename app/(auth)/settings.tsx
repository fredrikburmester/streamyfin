import { Button } from "@/components/Button";
import { Text } from "@/components/common/Text";
import { ListItem } from "@/components/ListItem";
import { apiAtom, useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import { readFromLog } from "@/utils/log";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { useAtom } from "jotai";
import { ScrollView, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useFiles } from "@/hooks/useFiles";

export default function settings() {
  const { logout } = useJellyfin();
  const { deleteAllFiles } = useFiles();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: logs } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => readFromLog(),
  });

  return (
    <ScrollView>
      <View className="p-4 flex flex-col gap-y-4 pb-12">
        <Text className="font-bold text-2xl">Information</Text>

        <View className="rounded-xl mb-4 overflow-hidden border-neutral-800 divide-y-2 divide-neutral-900">
          <ListItem title="User" subTitle={user?.Name} />
          <ListItem title="Server" subTitle={api?.basePath} />
        </View>

        <Button onPress={logout}>Log out</Button>

        <View className="my-2">
          <Button
            color="red"
            onPress={async () => {
              await deleteAllFiles();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            }}
          >
            Delete all downloaded files
          </Button>
        </View>

        <Text className="font-bold">Logs</Text>
        <View className="flex flex-col space-y-2">
          {logs?.map((log, index) => (
            <View
              key={index}
              className="bg-neutral-800 border border-neutral-900 rounded p-2"
            >
              <Text
                className={`
              ${log.level === "INFO" && "text-blue-500"}
              ${log.level === "ERROR" && "text-red-500"}
                `}
              >
                {log.level}
              </Text>
              <Text>{log.message}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
