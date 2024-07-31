import { Button } from "@/components/Button";
import { Text } from "@/components/common/Text";
import { runningProcesses } from "@/components/DownloadItem";
import { ListItem } from "@/components/ListItem";
import ProgressCircle from "@/components/ProgressCircle";
import { apiAtom, useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

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

  FileSystem.deleteAsync(`${FileSystem.documentDirectory}/${id}.mp4`).catch(
    (err) => console.error(err)
  );

  AsyncStorage.setItem(
    "downloaded_files",
    JSON.stringify([
      JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]"
      ).filter((f: string) => f !== id),
    ])
  );
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

      setFiles(data);
    })();
  }, [key]);

  return (
    <View className="p-4 flex flex-col gap-y-4">
      <Text className="font-bold text-2xl">Information</Text>

      <View className="rounded-xl mb-4 overflow-hidden border-neutral-800 divide-y-2 divide-neutral-900">
        <ListItem title="User" subTitle={user?.Name} />
        <ListItem title="Server" subTitle={api?.basePath} />
      </View>
      <Button onPress={logout}>Log out</Button>

      <View className="mb-4">
        <Text className="font-bold text-2xl">Downloads</Text>

        {files.length > 0 ? (
          <View>
            {files.map((file) => (
              <TouchableOpacity
                key={file.Id}
                className="rounded-xl overflow-hidden"
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
                      onPress={() => {
                        deleteFile(file.Id);
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
        ) : (
          <Text className="opacity-50">No downloaded files</Text>
        )}
      </View>

      <Button
        onPress={() => {
          deleteAllFiles();
          setKey((prevKey) => prevKey + 1);
        }}
      >
        Clear files data
      </Button>

      {session?.item.Id && (
        <Button
          onPress={() => {
            FFmpegKit.cancel();
            setSession(null);
          }}
        >
          Cancel all downloads
        </Button>
      )}
    </View>
  );
}
