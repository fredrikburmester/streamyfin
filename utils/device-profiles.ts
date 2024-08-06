import {
  DeviceProfile,
  DlnaProfileType,
} from "@jellyfin/sdk/lib/generated-client/models";

const MediaTypes = {
  Audio: "Audio",
  Video: "Video",
  Photo: "Photo",
  Book: "Book",
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

export const chromecastProfile: DeviceProfile = {
  Name: "Chromecast",
  Id: "chromecast-001",
  MaxStreamingBitrate: 4000000, // 4 Mbps
  MaxStaticBitrate: 4000000, // 4 Mbps
  MusicStreamingTranscodingBitrate: 384000, // 384 kbps
  DirectPlayProfiles: [
    {
      Container: "mp4,webm",
      Type: "Video",
      VideoCodec: "h264,vp8,vp9",
      AudioCodec: "aac,mp3,opus,vorbis",
    },
    {
      Container: "mp3",
      Type: "Audio",
    },
    {
      Container: "aac",
      Type: "Audio",
    },
    {
      Container: "flac",
      Type: "Audio",
    },
    {
      Container: "wav",
      Type: "Audio",
    },
  ],
  TranscodingProfiles: [
    {
      Container: "ts",
      Type: "Video",
      VideoCodec: "h264",
      AudioCodec: "aac,mp3",
      Protocol: "hls",
      Context: "Streaming",
      MaxAudioChannels: "2",
      MinSegments: 2,
      BreakOnNonKeyFrames: true,
    },
    {
      Container: "mp4",
      Type: "Video",
      VideoCodec: "h264",
      AudioCodec: "aac",
      Protocol: "http",
      Context: "Streaming",
      MaxAudioChannels: "2",
    },
    {
      Container: "mp3",
      Type: "Audio",
      AudioCodec: "mp3",
      Protocol: "http",
      Context: "Streaming",
      MaxAudioChannels: "2",
    },
    {
      Container: "aac",
      Type: "Audio",
      AudioCodec: "aac",
      Protocol: "http",
      Context: "Streaming",
      MaxAudioChannels: "2",
    },
  ],
  ContainerProfiles: [
    {
      Type: "Video",
      Container: "mp4",
    },
    {
      Type: "Video",
      Container: "webm",
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
          Value: "8",
        },
        {
          Condition: "LessThanEqual",
          Property: "VideoLevel",
          Value: "41",
        },
      ],
    },
    {
      Type: "Video",
      Codec: "vp9",
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "VideoBitDepth",
          Value: "10",
        },
      ],
    },
  ],
  SubtitleProfiles: [
    {
      Format: "vtt",
      Method: "Hls",
    },
    {
      Format: "vtt",
      Method: "External",
    },
  ],
};

export const iOSProfile_2: DeviceProfile = {
  Id: "iPhone",
  Name: "iPhone",
  MaxStreamingBitrate: 20000000,
  MaxStaticBitrate: 30000000,
  MusicStreamingTranscodingBitrate: 192000,
  DirectPlayProfiles: [
    {
      Container: "mp4,m4v",
      Type: "Video",
      VideoCodec: "h264,hevc,mp4v",
      AudioCodec: "aac,mp3,ac3,eac3,flac,alac",
    },
    {
      Container: "mov",
      Type: "Video",
      VideoCodec: "h264,hevc",
      AudioCodec: "aac,mp3,ac3,eac3,flac,alac",
    },
    {
      Container: "m4a",
      Type: "Audio",
      AudioCodec: "aac,alac",
    },
    {
      Container: "mp3",
      Type: "Audio",
      AudioCodec: "mp3",
    },
  ],
  TranscodingProfiles: [
    {
      Container: "ts",
      Type: "Video",
      VideoCodec: "h264",
      AudioCodec: "aac",
      Context: "Streaming",
      Protocol: "hls",
      MaxAudioChannels: "2",
      MinSegments: 2,
      BreakOnNonKeyFrames: true,
    },
    {
      Container: "mp3",
      Type: "Audio",
      AudioCodec: "mp3",
      Context: "Streaming",
      Protocol: "http",
    },
  ],
  ContainerProfiles: [],
  CodecProfiles: [
    {
      Type: "VideoAudio",
      Codec: "aac",
      Conditions: [
        {
          Condition: "Equals",
          Property: "IsSecondaryAudio",
          Value: "false",
          IsRequired: false,
        },
      ],
    },
    {
      Type: "VideoAudio",
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "AudioChannels",
          Value: "2",
          IsRequired: true,
        },
      ],
    },
    {
      Type: "Video",
      Codec: "h264",
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "VideoLevel",
          Value: "51",
          IsRequired: true,
        },
        {
          Condition: "EqualsAny",
          Property: "VideoProfile",
          Value: "main|high|baseline",
          IsRequired: true,
        },
      ],
    },
    {
      Type: "Video",
      Codec: "hevc",
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "VideoLevel",
          Value: "153",
          IsRequired: true,
        },
        {
          Condition: "EqualsAny",
          Property: "VideoProfile",
          Value: "main|main10",
          IsRequired: true,
        },
      ],
    },
  ],
  SubtitleProfiles: [
    {
      Format: "vtt",
      Method: "External",
    },
    {
      Format: "mov_text",
      Method: "Embed",
    },
  ],
};
