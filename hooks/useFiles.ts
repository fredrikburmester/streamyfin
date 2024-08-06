import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";

/**
 * Custom hook for managing downloaded files.
 * @returns An object with functions to delete individual files and all files.
 */
export const useFiles = () => {
  const queryClient = useQueryClient();

  /**
   * Deletes all downloaded files and clears the download record.
   */
  const deleteAllFiles = async (): Promise<void> => {
    const directoryUri = FileSystem.documentDirectory;
    if (!directoryUri) {
      console.error("Document directory is undefined");
      return;
    }

    try {
      const fileNames = await FileSystem.readDirectoryAsync(directoryUri);
      await Promise.all(
        fileNames.map((item) =>
          FileSystem.deleteAsync(`${directoryUri}/${item}`, {
            idempotent: true,
          }),
        ),
      );
      await AsyncStorage.removeItem("downloaded_files");
      queryClient.invalidateQueries({ queryKey: ["downloaded_files"] });
    } catch (error) {
      console.error("Failed to delete all files:", error);
    }
  };

  /**
   * Deletes a specific file and updates the download record.
   * @param id - The ID of the file to delete.
   */
  const deleteFile = async (id: string): Promise<void> => {
    if (!id) {
      console.error("Invalid file ID");
      return;
    }

    try {
      await FileSystem.deleteAsync(
        `${FileSystem.documentDirectory}/${id}.mp4`,
        { idempotent: true },
      );

      const currentFiles = await getDownloadedFiles();
      const updatedFiles = currentFiles.filter((f) => f.Id !== id);

      await AsyncStorage.setItem(
        "downloaded_files",
        JSON.stringify(updatedFiles),
      );

      queryClient.invalidateQueries({ queryKey: ["downloaded_files"] });
    } catch (error) {
      console.error(`Failed to delete file with ID ${id}:`, error);
    }
  };

  return { deleteFile, deleteAllFiles };
};

/**
 * Retrieves the list of downloaded files from AsyncStorage.
 * @returns An array of BaseItemDto objects representing downloaded files.
 */
async function getDownloadedFiles(): Promise<BaseItemDto[]> {
  try {
    const filesJson = await AsyncStorage.getItem("downloaded_files");
    return filesJson ? JSON.parse(filesJson) : [];
  } catch (error) {
    console.error("Failed to retrieve downloaded files:", error);
    return [];
  }
}
