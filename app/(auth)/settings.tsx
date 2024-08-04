import { Button } from "@/components/Button";
import { Text } from "@/components/common/Text";
import { ListItem } from "@/components/ListItem";
import ProgressCircle from "@/components/ProgressCircle";
import { apiAtom, useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import { runningProcesses } from "@/utils/atoms/downloads";
import { readFromLog } from "@/utils/log";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

const deleteAllFiles = async () => {
  const directoryUri = FileSystem.documentDirectory;

  try {
    const fileNames = await FileSystem.readDirectoryAsync(directoryUri!);
    for (let item of fileNames) {
      await FileSystem.deleteAsync(`${directoryUri}/${item}`);
    }

    AsyncStorage.removeItem("downloaded_files");
  } catch (error) {
    console.error("Failed to delete the directory:", error);
  }
};

const deleteFile = async (id: string | null | undefined) => {
  if (!id) return;

  try {
    FileSystem.deleteAsync(`${FileSystem.documentDirectory}/${id}.mp4`).catch(
      (err) => console.error(err)
    );

    const currentFiles = JSON.parse(
      (await AsyncStorage.getItem("downloaded_files")) ?? "[]"
    ) as BaseItemDto[];
    const updatedFiles = currentFiles.filter((f) => f.Id !== id);
    await AsyncStorage.setItem(
      "downloaded_files",
      JSON.stringify(updatedFiles)
    );
  } catch (error) {
    console.error(error);
  }
};

const listDownloadedFiles = async () => {
  const directoryUri = FileSystem.documentDirectory; // Directory where files are stored

  try {
    const fileNames = await FileSystem.readDirectoryAsync(directoryUri!);
    return fileNames; // This will be an array of file names in the directory
  } catch (error) {
    console.error("Failed to read the directory:", error);
    return [];
  }
};

export default function settings() {
  const { logout } = useJellyfin();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [files, setFiles] = useState<BaseItemDto[]>([]);
  const [key, setKey] = useState(0);

  const [session, setSession] = useAtom(runningProcesses);

  const router = useRouter();

  const [activeProcess] = useAtom(runningProcesses);

  useEffect(() => {
    (async () => {
      const data = JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]"
      ) as BaseItemDto[];

      console.log(
        "Files",
        data.map((i) => i.Name)
      );

      setFiles(data);
    })();
  }, [key]);

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

        <View className="mb-4">
          <Text className="font-bold text-2xl mb-4">Downloads</Text>

          {files.length > 0 ? (
            <View>
              {files.map((file) => (
                <TouchableOpacity
                  key={file.Id}
                  className="rounded-xl overflow-hidden mb-2"
                  onPress={() => {
                    router.back();
                    router.push(
                      `/(auth)/player/offline/page?url=${file.Id}.mp4&itemId=${file.Id}`
                    );
                  }}
                >
                  <ListItem
                    title={file.Name}
                    subTitle={file.ProductionYear?.toString()}
                    iconAfter={
                      <TouchableOpacity
                        onPress={async () => {
                          await deleteFile(file.Id);
                          setKey((prevKey) => prevKey + 1);
                        }}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={24}
                          color="white"
                        />
                      </TouchableOpacity>
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : activeProcess ? (
            <View className="rounded-xl overflow-hidden mb-2">
              <ListItem
                title={activeProcess.item.Name}
                iconAfter={
                  <ProgressCircle
                    size={22}
                    fill={activeProcess.progress}
                    width={3}
                    tintColor="#3498db"
                    backgroundColor="#bdc3c7"
                  />
                }
              />
            </View>
          ) : (
            <Text className="opacity-50">No downloaded files</Text>
          )}
        </View>

        <Button
          className="mb-2"
          color="red"
          onPress={async () => {
            await deleteAllFiles();
            setKey((prevKey) => prevKey + 1);
          }}
        >
          Clear downloads
        </Button>

        {session?.item.Id && (
          <Button
            className="mb-2"
            onPress={() => {
              FFmpegKit.cancel();
              setSession(null);
            }}
          >
            Cancel all downloads
          </Button>
        )}

        <Text className="font-bold">Logs</Text>
        <View className="flex flex-col space-y-2">
          {logs?.map((l) => (
            <View className="bg-neutral-800 border border-neutral-900 rounded p-2">
              <Text
                className={`
              ${l.level === "INFO" && "text-blue-500"}
              ${l.level === "ERROR" && "text-red-500"}
                `}
              >
                {l.level}
              </Text>
              <Text>{l.message}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
