import { Api } from "@jellyfin/sdk";

/**
 * Generates the authorization headers for Jellyfin API requests.
 */
export const getAuthHeaders = (api: Api) => ({
  Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
});
