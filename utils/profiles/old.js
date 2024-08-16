/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MediaTypes from "../../constants/MediaTypes";

/**
 * Device profile for old phones (aka does not support HEVC)
 *
 * This file is a modified version of the original file.
 *
 * Link to original: https://github.com/jellyfin/jellyfin-expo/blob/e7b7e736a8602c94612917ef02de22f87c7c28f2/utils/profiles/ios.js#L4
 */
export default {
  MaxStreamingBitrate: 3000000,
  MaxStaticBitrate: 3000000,
  MusicStreamingTranscodingBitrate: 256000,
  DirectPlayProfiles: [
    {
      Container: "mp4,m4v",
      Type: "Video",
      VideoCodec: "h264",
      AudioCodec: "aac,mp3,mp2",
    },
    {
      Container: "mkv",
      Type: "Video",
      VideoCodec: "h264",
      AudioCodec: "aac,mp3,mp2",
    },
    {
      Container: "mov",
      Type: "Video",
      VideoCodec: "h264",
      AudioCodec: "aac,mp3,mp2",
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
      Container: "m4a",
      AudioCodec: "aac",
      Type: "Audio",
    },
    {
      Container: "m4b",
      AudioCodec: "aac",
      Type: "Audio",
    },
    {
      Container: "hls",
      Type: "Video",
      VideoCodec: "h264",
      AudioCodec: "aac,mp3,mp2",
    },
  ],
  TranscodingProfiles: [
    {
      Container: "mp4",
      Type: "Audio",
      AudioCodec: "aac",
      Context: "Streaming",
      Protocol: "hls",
      MaxAudioChannels: "2",
      MinSegments: "1",
      BreakOnNonKeyFrames: true,
    },
    {
      Container: "aac",
      Type: "Audio",
      AudioCodec: "aac",
      Context: "Streaming",
      Protocol: "http",
      MaxAudioChannels: "2",
    },
    {
      Container: "mp3",
      Type: "Audio",
      AudioCodec: "mp3",
      Context: "Streaming",
      Protocol: "http",
      MaxAudioChannels: "2",
    },
    {
      Container: "mp3",
      Type: "Audio",
      AudioCodec: "mp3",
      Context: "Static",
      Protocol: "http",
      MaxAudioChannels: "2",
    },
    {
      Container: "aac",
      Type: "Audio",
      AudioCodec: "aac",
      Context: "Static",
      Protocol: "http",
      MaxAudioChannels: "2",
    },
    {
      Container: "mp4",
      Type: "Video",
      AudioCodec: "aac,mp2",
      VideoCodec: "h264",
      Context: "Streaming",
      Protocol: "hls",
      MaxAudioChannels: "2",
      MinSegments: "1",
      BreakOnNonKeyFrames: true,
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "Width",
          Value: "960",
          IsRequired: false,
        },
        {
          Condition: "LessThanEqual",
          Property: "Height",
          Value: "960",
          IsRequired: false,
        },
        {
          Condition: "LessThanEqual",
          Property: "VideoFramerate",
          Value: "60",
          IsRequired: false,
        },
      ],
    },
    {
      Container: "ts",
      Type: "Video",
      AudioCodec: "aac,mp3,mp2",
      VideoCodec: "h264",
      Context: "Streaming",
      Protocol: "hls",
      MaxAudioChannels: "2",
      MinSegments: "1",
      BreakOnNonKeyFrames: true,
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "Width",
          Value: "960",
          IsRequired: false,
        },
        {
          Condition: "LessThanEqual",
          Property: "Height",
          Value: "960",
          IsRequired: false,
        },
        {
          Condition: "LessThanEqual",
          Property: "VideoFramerate",
          Value: "60",
          IsRequired: false,
        },
      ],
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
          Condition: "Equals",
          Property: "IsSecondaryAudio",
          Value: "false",
          IsRequired: false,
        },
      ],
    },
    {
      Type: "Video",
      Codec: "h264",
      Conditions: [
        {
          Condition: "NotEquals",
          Property: "IsAnamorphic",
          Value: "true",
          IsRequired: false,
        },
        {
          Condition: "EqualsAny",
          Property: "VideoProfile",
          Value: "high|main|baseline|constrained baseline",
          IsRequired: false,
        },
        {
          Condition: "EqualsAny",
          Property: "VideoRangeType",
          Value: "SDR",
          IsRequired: false,
        },
        {
          Condition: "LessThanEqual",
          Property: "VideoLevel",
          Value: "52",
          IsRequired: false,
        },
        {
          Condition: "NotEquals",
          Property: "IsInterlaced",
          Value: "true",
          IsRequired: false,
        },
      ],
    },
    {
      Type: "Video",
      Conditions: [
        {
          Condition: "LessThanEqual",
          Property: "Width",
          Value: "960",
          IsRequired: false,
        },
        {
          Condition: "LessThanEqual",
          Property: "Height",
          Value: "960",
          IsRequired: false,
        },
        {
          Condition: "LessThanEqual",
          Property: "VideoFramerate",
          Value: "65",
          IsRequired: false,
        },
      ],
    },
  ],
  SubtitleProfiles: [
    {
      Method: "Encode",
    },
  ],
};
