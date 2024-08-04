import { MediaSourceInfo } from "@jellyfin/sdk/lib/generated-client/models";

export function createVideoUrl(mediaSource: MediaSourceInfo): string {
  const baseUrl = `/videos/${mediaSource.Id}/main.m3u8`;
  const urlParams = new URLSearchParams();

  // Extract query parameters from TranscodingUrl
  const transcodingUrlParts = mediaSource.TranscodingUrl?.split("?") ?? [];
  if (transcodingUrlParts.length > 1) {
    const queryParams = new URLSearchParams(transcodingUrlParts[1]);
    queryParams.forEach((value, key) => {
      urlParams.append(key, value);
    });
  }

  // Add or update specific parameters based on the mediaSource object
  if (mediaSource.DefaultAudioStreamIndex !== undefined) {
    urlParams.set(
      "AudioStreamIndex",
      mediaSource.DefaultAudioStreamIndex?.toString() || ""
    );
  }

  if (mediaSource.DefaultSubtitleStreamIndex !== undefined) {
    urlParams.set(
      "SubtitleStreamIndex",
      mediaSource.DefaultSubtitleStreamIndex?.toString() || ""
    );
  }

  // Add information about available streams
  if (mediaSource.MediaStreams) {
    const videoStreams = mediaSource.MediaStreams.filter(
      (stream) => stream.Type === "Video"
    );
    const audioStreams = mediaSource.MediaStreams.filter(
      (stream) => stream.Type === "Audio"
    );
    const subtitleStreams = mediaSource.MediaStreams.filter(
      (stream) => stream.Type === "Subtitle"
    );

    if (videoStreams.length > 0) {
      urlParams.set(
        "VideoStreamIndex",
        videoStreams[0].Index?.toString() || ""
      );
    }

    if (audioStreams.length > 0) {
      const defaultAudioStream =
        audioStreams.find((stream) => stream.IsDefault) || audioStreams[0];
      urlParams.set(
        "AudioStreamIndex",
        defaultAudioStream.Index?.toString() || ""
      );
      urlParams.set("AudioCodec", defaultAudioStream.Codec || "");
    }

    if (subtitleStreams.length > 0) {
      const defaultSubtitleStream = subtitleStreams.find(
        (stream) => stream.IsDefault
      );
      if (defaultSubtitleStream?.Index) {
        urlParams.set(
          "SubtitleStreamIndex",
          defaultSubtitleStream.Index.toString()
        );
      }
    }
  }

  console.log("createVideoUrl ~", `${baseUrl}?${urlParams.toString()}`);

  return `${baseUrl}?${urlParams.toString()}`;
}
