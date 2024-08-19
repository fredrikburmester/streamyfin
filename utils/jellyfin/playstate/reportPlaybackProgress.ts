import { Api } from "@jellyfin/sdk";
import { getAuthHeaders } from "../jellyfin";
import { postCapabilities } from "../session/capabilities";

interface ReportPlaybackProgressParams {
  api?: Api | null;
  sessionId?: string | null;
  itemId?: string | null;
  positionTicks?: number | null;
  IsPaused?: boolean;
}

/**
 * Reports playback progress to the Jellyfin server.
 *
 * @param params - The parameters for reporting playback progress
 * @throws {Error} If any required parameter is missing
 */
export const reportPlaybackProgress = async ({
  api,
  sessionId,
  itemId,
  positionTicks,
  IsPaused = false,
}: ReportPlaybackProgressParams): Promise<void> => {
  if (!api || !sessionId || !itemId || !positionTicks) {
    console.error("Missing required parameter");
    return;
  }

  console.info("reportPlaybackProgress ~ IsPaused", IsPaused);

  try {
    await postCapabilities({
      api,
      itemId,
      sessionId,
    });
  } catch (error) {
    console.error("Failed to post capabilities.", error);
    throw new Error("Failed to post capabilities.");
  }

  try {
    await api.axiosInstance.post(
      `${api.basePath}/Sessions/Playing/Progress`,
      {
        ItemId: itemId,
        PlaySessionId: sessionId,
        IsPaused,
        PositionTicks: Math.round(positionTicks),
        CanSeek: true,
        MediaSourceId: itemId,
        EventName: "timeupdate",
      },
      { headers: getAuthHeaders(api) }
    );
  } catch (error) {
    console.error(error);
  }
};
