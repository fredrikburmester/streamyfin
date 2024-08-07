import { Api } from "@jellyfin/sdk";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

/**
 * Retrieves the primary image URL for a given item.
 *
 * @param api - The Jellyfin API instance.
 * @param item - The media item to retrieve the backdrop image URL for.
 * @param quality - The desired image quality (default: 10).
 */
export const getLogoImageUrlById = ({
  api,
  item,
}: {
  api?: Api | null;
  item?: BaseItemDto | null;
}) => {
  if (!api || !item) {
    return null;
  }

  const imageTags = item.ImageTags?.["Logo"];

  if (!imageTags) return null;

  const params = new URLSearchParams();

  params.append("tag", imageTags);
  params.append("quality", "90");
  params.append("fillHeight", "130");

  return `${api.basePath}/Items/${item.Id}/Images/Logo?${params.toString()}`;
};
