import { DeviceProfile } from "@jellyfin/sdk/lib/generated-client/models";

const MediaTypes = {
  Audio: "Audio",
  Video: "Video",
  Photo: "Photo",
  Book: "Book",
};

export const iPhone15Profile: DeviceProfile = {
  Name: "iPhone 15",
  Id: "iphone15-001",
  MaxStreamingBitrate: 5000000, // 5 Mbps
  MaxStaticBitrate: 10000000, // 10 Mbps
  MusicStreamingTranscodingBitrate: 320000, // 320 kbps
  MaxStaticMusicBitrate: 1411200, // CD Quality at 1,411.2 kbps
  DirectPlayProfiles: [
    {
      Container: "mp4",
      VideoCodec: "h264",
      AudioCodec: "aac",
    },
  ],
  TranscodingProfiles: [
    {
      Container: "hls",
      Type: "Video",
      VideoCodec: "h265",
      Context: "Streaming",
    },
  ],
  ContainerProfiles: [
    {
      Type: "Video",
      Container: "mp4",
    },
    {
      Type: "Video",
      Container: "mov",
    },
  ],
  CodecProfiles: [
    {
      Type: "Video",
      Codec: "h264",
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "VideoBitDepth",
          Value: "10",
        },
      ],
    },
    {
      Type: "Video",
      Codec: "h265",
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "VideoBitDepth",
          Value: "10",
        },
      ],
    },
    {
      Type: "Audio",
      Codec: "aac",
      Conditions: [
        {
          Condition: "GreaterThanEqual",
          Property: "AudioChannels",
          Value: "2",
        },
      ],
    },
  ],
  SubtitleProfiles: [
    {
      Format: "srt",
      Method: "External",
    },
    {
      Format: "vtt",
      Method: "External",
    },
  ],
};

const BaseProfile = {
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

export const iosProfile = {
  ...BaseProfile,
  Name: "Expo iOS Video Profile",
  DirectPlayProfiles: [
    {
      AudioCodec: "aac,mp3,ac3,eac3,flac,alac",
      Container: "mp4,m4v",
      Type: MediaTypes.Video,
      VideoCodec: "hevc,h264",
    },
    {
      AudioCodec: "aac,mp3,ac3,eac3,flac,alac",
      Container: "mov",
      Type: MediaTypes.Video,
      VideoCodec: "hevc,h264",
    },
    {
      Container: "mp3",
      Type: MediaTypes.Audio,
    },
    {
      Container: "aac",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "aac",
      Container: "m4a",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "aac",
      Container: "m4b",
      Type: MediaTypes.Audio,
    },
    {
      Container: "flac",
      Type: MediaTypes.Audio,
    },
    {
      Container: "alac",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "alac",
      Container: "m4a",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "alac",
      Container: "m4b",
      Type: MediaTypes.Audio,
    },
    {
      Container: "wav",
      Type: MediaTypes.Audio,
    },
  ],
  TranscodingProfiles: [
    {
      AudioCodec: "aac",
      BreakOnNonKeyFrames: true,
      Container: "aac",
      Context: "Streaming",
      MaxAudioChannels: "6",
      MinSegments: "2",
      Protocol: "hls",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "aac",
      Container: "aac",
      Context: "Streaming",
      MaxAudioChannels: "6",
      Protocol: "http",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "mp3",
      Container: "mp3",
      Context: "Streaming",
      MaxAudioChannels: "6",
      Protocol: "http",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "wav",
      Container: "wav",
      Context: "Streaming",
      MaxAudioChannels: "6",
      Protocol: "http",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "mp3",
      Container: "mp3",
      Context: "Static",
      MaxAudioChannels: "6",
      Protocol: "http",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "aac",
      Container: "aac",
      Context: "Static",
      MaxAudioChannels: "6",
      Protocol: "http",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "wav",
      Container: "wav",
      Context: "Static",
      MaxAudioChannels: "6",
      Protocol: "http",
      Type: MediaTypes.Audio,
    },
    {
      AudioCodec: "aac,mp3",
      BreakOnNonKeyFrames: true,
      Container: "ts",
      Context: "Streaming",
      MaxAudioChannels: "6",
      MinSegments: "2",
      Protocol: "hls",
      Type: MediaTypes.Video,
      VideoCodec: "h264",
    },
    {
      AudioCodec: "aac,mp3,ac3,eac3,flac,alac",
      Container: "mp4",
      Context: "Static",
      Protocol: "http",
      Type: MediaTypes.Video,
      VideoCodec: "h264",
    },
  ],
};
