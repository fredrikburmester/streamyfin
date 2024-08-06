import { Api } from "@jellyfin/sdk";
import { AxiosError } from "axios";
import { getAuthHeaders } from "../jellyfin";

interface ReportPlaybackProgressParams {
  api: Api | null | undefined;
  sessionId: string | null | undefined;
  itemId: string | null | undefined;
  positionTicks: number | null | undefined;
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
}: ReportPlaybackProgressParams): Promise<void> => {
  if (!api || !sessionId || !itemId || positionTicks == null) {
    throw new Error("Missing required parameters for reportPlaybackProgress");
  }

  try {
    await api.axiosInstance.post(
      `${api.basePath}/Sessions/Playing/Progress`,
      {
        ItemId: itemId,
        PlaySessionId: sessionId,
        IsPaused: false,
        PositionTicks: Math.round(positionTicks),
        CanSeek: true,
        MediaSourceId: itemId,
      },
      { headers: getAuthHeaders(api) },
    );
  } catch (error) {
    console.log(error);
  }
};
