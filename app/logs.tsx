import { Text } from "@/components/common/Text";
import { readFromLog } from "@/utils/log";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Logs: React.FC = () => {
  const { data: logs } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => (await readFromLog()).reverse(),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 p-4"
      contentContainerStyle={{ gap: 10, paddingBottom: insets.top }}
    >
      <View className="flex flex-col">
        {logs?.map((log, index) => (
          <View key={index} className="border-b-neutral-800 border py-3">
            <View className="flex flex-row justify-between items-center mb-2">
              <Text
                className={`
                    text-xs
                ${log.level === "INFO" && "text-blue-500"}
                ${log.level === "ERROR" && "text-red-500"}
                  `}
              >
                {log.level}
              </Text>
              <Text className="text-xs text-neutral-500">
                {new Date(log.timestamp).toLocaleString()}
              </Text>
            </View>
            <Text uiTextView selectable className="text-xs mb-1">
              {log.message}
            </Text>
            {log.data && (
              <Text uiTextView selectable className="text-xs">
                {log.data}
              </Text>
            )}
          </View>
        ))}
        {logs?.length === 0 && (
          <Text className="opacity-50">No logs available</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default Logs;
