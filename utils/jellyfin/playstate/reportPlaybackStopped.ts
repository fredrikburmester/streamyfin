import { Api } from "@jellyfin/sdk";
import { AxiosError } from "axios";
import { getAuthHeaders } from "../jellyfin";
import { writeToLog } from "@/utils/log";

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
  if (!positionTicks || positionTicks === 0) return;

  if (!api) {
    writeToLog("WARN", "Could not report playback stopped due to missing api");
    return;
  }

  if (!sessionId) {
    writeToLog(
      "WARN",
      "Could not report playback stopped due to missing session id"
    );
    return;
  }

  if (!itemId) {
    writeToLog(
      "WARN",
      "Could not report playback progress due to missing item id"
    );
    return;
  }

  try {
    const url = `${api.basePath}/PlayingItems/${itemId}`;
    const params = {
      playSessionId: sessionId,
      positionTicks: Math.round(positionTicks),
      MediaSourceId: itemId,
      IsPaused: true,
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
        error.response?.data
      );
    } else {
      console.error("Failed to report playback progress", error);
    }
  }
};
