/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MediaTypes from "../../constants/MediaTypes";

import BaseProfile from "./base";

/**
 * Device profile for Expo Video player on iOS 13+
 */
export default {
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
