import MediaTypes from "../../constants/MediaTypes";

export default {
  Name: "Expo Base Video Profile",
  MaxStaticBitrate: 100000000,
  MaxStreamingBitrate: 120000000,
  MusicStreamingTranscodingBitrate: 384000,
  CodecProfiles: [
    {
      Codec: "h264",
      Conditions: [
        {
          Condition: "NotEquals",
          IsRequired: false,
          Property: "IsAnamorphic",
          Value: "true",
        },
        {
          Condition: "EqualsAny",
          IsRequired: false,
          Property: "VideoProfile",
          Value: "high|main|baseline|constrained baseline",
        },
        {
          Condition: "LessThanEqual",
          IsRequired: false,
          Property: "VideoLevel",
          Value: "51",
        },
        {
          Condition: "NotEquals",
          IsRequired: false,
          Property: "IsInterlaced",
          Value: "true",
        },
      ],
      Type: MediaTypes.Video,
    },
    {
      Codec: "hevc",
      Conditions: [
        {
          Condition: "NotEquals",
          IsRequired: false,
          Property: "IsAnamorphic",
          Value: "true",
        },
        {
          Condition: "EqualsAny",
          IsRequired: false,
          Property: "VideoProfile",
          Value: "main|main 10",
        },
        {
          Condition: "LessThanEqual",
          IsRequired: false,
          Property: "VideoLevel",
          Value: "183",
        },
        {
          Condition: "NotEquals",
          IsRequired: false,
          Property: "IsInterlaced",
          Value: "true",
        },
      ],
      Type: MediaTypes.Video,
    },
  ],
  ContainerProfiles: [],
  DirectPlayProfiles: [],
  ResponseProfiles: [
    {
      Container: "m4v",
      MimeType: "video/mp4",
      Type: MediaTypes.Video,
    },
  ],
  SubtitleProfiles: [
    {
      Format: "vtt",
      Method: "Hls",
    },
  ],
  TranscodingProfiles: [],
};
