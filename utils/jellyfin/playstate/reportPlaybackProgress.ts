import { Api } from "@jellyfin/sdk";
import { getAuthHeaders } from "../jellyfin";
import { postCapabilities } from "../session/capabilities";
import { Settings } from "@/utils/atoms/settings";
import {
  getMediaInfoApi,
  getPlaystateApi,
  getSessionApi,
} from "@jellyfin/sdk/lib/utils/api";
import { DeviceProfile } from "@jellyfin/sdk/lib/generated-client";
import { getOrSetDeviceId } from "@/providers/JellyfinProvider";
import ios from "@/utils/profiles/ios";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";

interface ReportPlaybackProgressParams {
  api?: Api | null;
  sessionId?: string | null;
  itemId?: string | null;
  positionTicks?: number | null;
  IsPaused?: boolean;
  deviceProfile?: Settings["deviceProfile"];
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
  deviceProfile,
}: ReportPlaybackProgressParams): Promise<void> => {
  if (!api || !sessionId || !itemId || !positionTicks) {
    return;
  }

  console.info("reportPlaybackProgress ~ IsPaused", IsPaused);

  try {
    await getPlaystateApi(api).onPlaybackProgress({
      itemId,
      audioStreamIndex: 0,
      subtitleStreamIndex: 0,
      mediaSourceId: itemId,
      positionTicks: Math.round(positionTicks),
      isPaused: IsPaused,
      isMuted: false,
      playMethod: "Transcode",
    });
    // await api.axiosInstance.post(
    //   `${api.basePath}/Sessions/Playing/Progress`,
    //   {
    //     ItemId: itemId,
    //     PlaySessionId: sessionId,
    //     IsPaused,
    //     PositionTicks: Math.round(positionTicks),
    //     CanSeek: true,
    //     MediaSourceId: itemId,
    //     EventName: "timeupdate",
    //   },
    //   { headers: getAuthHeaders(api) }
    // );
  } catch (error) {
    console.error(error);
  }
};
