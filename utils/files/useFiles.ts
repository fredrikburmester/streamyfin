import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";

export const useFiles = () => {
  const queryClient = useQueryClient();

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

  const deleteFile = async (id: string) => {
    try {
      const files = await FileSystem.readDirectoryAsync(
        `${FileSystem.documentDirectory}`
      );
      console.log(`Files:`, files);

      await FileSystem.deleteAsync(
        `${FileSystem.documentDirectory}/${id}.mp4`
      ).catch((err) => console.error(err));

      const currentFiles = JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) ?? "[]"
      ) as BaseItemDto[];

      console.log(
        "Current files",
        currentFiles.map((i) => i.Name)
      );

      const updatedFiles = currentFiles.filter((f) => f.Id !== id);

      console.log(
        "Current files",
        currentFiles.map((i) => i.Name)
      );

      await AsyncStorage.setItem(
        "downloaded_files",
        JSON.stringify(updatedFiles)
      );

      queryClient.invalidateQueries({ queryKey: ["downloaded_files"] });
    } catch (error) {
      console.error(error);
    }
  };

  return { deleteFile, deleteAllFiles };
};
