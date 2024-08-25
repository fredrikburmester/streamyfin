import { Api } from "@jellyfin/sdk";
import {
  SessionApi,
  SessionApiPostCapabilitiesRequest,
} from "@jellyfin/sdk/lib/generated-client/api/session-api";
import { getSessionApi } from "@jellyfin/sdk/lib/utils/api";
import { AxiosError, AxiosResponse } from "axios";
import { getAuthHeaders } from "../jellyfin";

interface PostCapabilitiesParams {
  api: Api | null | undefined;
  itemId: string | null | undefined;
  sessionId: string | null | undefined;
}

/**
 * Marks a media item as not played for a specific user.
 *
 * @param params - The parameters for marking an item as not played
 * @returns A promise that resolves to true if the operation was successful, false otherwise
 */
export const postCapabilities = async ({
  api,
  itemId,
  sessionId,
}: PostCapabilitiesParams): Promise<AxiosResponse> => {
  if (!api || !itemId || !sessionId) {
    throw new Error("Missing required parameters");
  }

  try {
    const d = api.axiosInstance.post(
      api.basePath + "/Sessions/Capabilities/Full",
      {
        playableMediaTypes: ["Audio", "Video", "Audio"],
        supportedCommands: [
          "PlayState",
          "Play",
          "ToggleFullscreen",
          "DisplayMessage",
          "Mute",
          "Unmute",
          "SetVolume",
          "ToggleMute",
        ],
        supportsMediaControl: true,
        id: sessionId,
      },
      {
        headers: getAuthHeaders(api),
      }
    );
    return d;
  } catch (error: any | AxiosError) {
    console.log("Failed to mark as not played", error);
    throw new Error("Failed to mark as not played");
  }
};
