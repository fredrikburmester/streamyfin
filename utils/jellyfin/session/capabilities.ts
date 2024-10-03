import { Settings } from "@/utils/atoms/settings";
import ios from "@/utils/profiles/ios";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";
import { Api } from "@jellyfin/sdk";
import { AxiosError, AxiosResponse } from "axios";
import { useMemo } from "react";
import { getAuthHeaders } from "../jellyfin";

interface PostCapabilitiesParams {
  api: Api | null | undefined;
  itemId: string | null | undefined;
  sessionId: string | null | undefined;
  deviceProfile: Settings["deviceProfile"];
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
  deviceProfile,
}: PostCapabilitiesParams): Promise<AxiosResponse> => {
  if (!api || !itemId || !sessionId) {
    throw new Error("Missing parameters for marking item as not played");
  }

  let profile: any = ios;

  if (deviceProfile === "Native") {
    profile = native;
  }
  if (deviceProfile === "Old") {
    profile = old;
  }

  try {
    const d = api.axiosInstance.post(
      api.basePath + "/Sessions/Capabilities/Full",
      {
        playableMediaTypes: ["Audio", "Video"],
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
        DeviceProfile: profile,
      },
      {
        headers: getAuthHeaders(api),
      }
    );
    return d;
  } catch (error: any | AxiosError) {
    throw new Error("Failed to mark as not played");
  }
};
