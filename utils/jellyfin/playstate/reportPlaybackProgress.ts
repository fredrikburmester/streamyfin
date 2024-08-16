import { Api } from "@jellyfin/sdk";
import { AxiosError } from "axios";
import { getAuthHeaders } from "../jellyfin";

interface ReportPlaybackProgressParams {
  api: Api;
  sessionId: string;
  itemId: string;
  positionTicks: number;
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
  console.info(
    "Reporting playback progress:",
    sessionId,
    itemId,
    positionTicks,
  );
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
    console.error(error);
  }
};
