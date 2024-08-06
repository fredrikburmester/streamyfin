import { Api } from "@jellyfin/sdk";
import { AxiosError } from "axios";
import { getAuthHeaders } from "../jellyfin";

interface PlaybackStoppedParams {
  api: Api | null | undefined;
  sessionId: string | null | undefined;
  itemId: string | null | undefined;
  positionTicks: number | null | undefined;
}

/**
 * Reports playback stopped event to the Jellyfin server.
 *
 * @param {PlaybackStoppedParams} params - The parameters for the report.
 * @param {Api} params.api - The Jellyfin API instance.
 * @param {string} params.sessionId - The session ID.
 * @param {string} params.itemId - The item ID.
 * @param {number} params.positionTicks - The playback position in ticks.
 */
export const reportPlaybackStopped = async ({
  api,
  sessionId,
  itemId,
  positionTicks,
}: PlaybackStoppedParams): Promise<void> => {
  // Validate input parameters
  if (!api || !sessionId || !itemId || !positionTicks) {
    console.log("Missing required parameters", {
      api,
      sessionId,
      itemId,
      positionTicks,
    });
    return;
  }

  try {
    const url = `${api.basePath}/PlayingItems/${itemId}`;
    const params = {
      playSessionId: sessionId,
      positionTicks: Math.round(positionTicks),
      mediaSourceId: itemId,
    };
    const headers = getAuthHeaders(api);

    // Send DELETE request to report playback stopped
    await api.axiosInstance.delete(url, { params, headers });
  } catch (error) {
    // Log the error with additional context
    if (error instanceof AxiosError) {
      console.error(
        "Failed to report playback progress",
        error.message,
        error.response?.data,
      );
    } else {
      console.error("Failed to report playback progress", error);
    }
  }
};
