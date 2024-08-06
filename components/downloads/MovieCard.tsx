import { TouchableOpacity, View } from "react-native";
import { Text } from "../common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { runtimeTicksToMinutes } from "@/utils/time";
import * as ContextMenu from "zeego/context-menu";
import { router } from "expo-router";
import { useFiles } from "@/utils/files/useFiles";

export const MovieCard: React.FC<{ item: BaseItemDto }> = ({ item }) => {
  const { deleteFile } = useFiles();

  const openFile = () => {
    router.push(
      `/(auth)/player/offline/page?url=${item.Id}.${item.MediaSources?.[0].Container}&itemId=${item.Id}`
    );
  };

  const options = [
    {
      label: "Delete",
      onSelect: (id: string) => deleteFile(id),
      destructive: true,
    },
  ];

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <TouchableOpacity
          onPress={openFile}
          className="bg-neutral-800 border border-neutral-900 rounded-2xl p-4"
        >
          <Text className=" font-bold">{item.Name}</Text>
          <View className="flex flex-row items-center justify-between">
            <Text className=" text-xs opacity-50">{item.ProductionYear}</Text>
            <Text className=" text-xs opacity-50">
              {runtimeTicksToMinutes(item.RunTimeTicks)}
            </Text>
          </View>
        </TouchableOpacity>
      </ContextMenu.Trigger>
      <ContextMenu.Content
        alignOffset={0}
        avoidCollisions={false}
        collisionPadding={0}
        loop={false}
      >
        {options.map((i) => (
          <ContextMenu.Item
            onSelect={() => {
              i.onSelect(item.Id!);
            }}
            key={i.label}
            destructive={i.destructive}
          >
            <ContextMenu.ItemTitle
              style={{
                color: "red",
              }}
            >
              {i.label}
            </ContextMenu.ItemTitle>
          </ContextMenu.Item>
        ))}
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
};
