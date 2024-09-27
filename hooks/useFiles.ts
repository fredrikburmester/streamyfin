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
    try {
      // Get all downloaded items
      const downloadedItems = await AsyncStorage.getItem("downloadedItems");
      if (downloadedItems) {
        const items = JSON.parse(downloadedItems);

        // Delete each item's folder
        for (const item of items) {
          const folderPath = `${FileSystem.documentDirectory}${item.Id}`;
          await FileSystem.deleteAsync(folderPath, { idempotent: true });
        }
      }

      // Clear the downloadedItems in AsyncStorage
      await AsyncStorage.removeItem("downloadedItems");

      // Invalidate the query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["downloaded_files"] });

      console.log(
        "Successfully deleted all downloaded files and cleared AsyncStorage"
      );
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
      // Delete the entire folder
      const folderPath = `${FileSystem.documentDirectory}${id}`;
      await FileSystem.deleteAsync(folderPath, { idempotent: true });

      // Remove the item from AsyncStorage
      const downloadedItems = await AsyncStorage.getItem("downloadedItems");
      if (downloadedItems) {
        let items = JSON.parse(downloadedItems);
        items = items.filter((item: any) => item.Id !== id);
        await AsyncStorage.setItem("downloadedItems", JSON.stringify(items));
      }

      // Invalidate the query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["downloaded_files"] });

      console.log(
        `Successfully deleted folder and AsyncStorage entry for ID ${id}`
      );
    } catch (error) {
      console.error(
        `Failed to delete folder and AsyncStorage entry for ID ${id}:`,
        error
      );
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
