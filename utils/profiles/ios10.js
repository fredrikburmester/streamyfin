/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MediaTypes from '../../constants/MediaTypes';

import BaseProfile from './base';

/**
 * Device profile for Expo Video player on iOS 10
 */
export default {
	...BaseProfile,
	Name: 'Expo iOS 10 Video Profile',
	CodecProfiles: [
		// iOS<13 only supports max h264 level 4.2 in ts containers
		{
			Codec: 'h264',
			Conditions: [
				{
					Condition: 'NotEquals',
					IsRequired: false,
					Property: 'IsAnamorphic',
					Value: 'true'
				},
				{
					Condition: 'EqualsAny',
					IsRequired: false,
					Property: 'VideoProfile',
					Value: 'high|main|baseline|constrained baseline'
				},
				{
					Condition: 'NotEquals',
					IsRequired: false,
					Property: 'IsInterlaced',
					Value: 'true'
				},
				{
					Condition: 'LessThanEqual',
					IsRequired: false,
					Property: 'VideoLevel',
					Value: '42'
				}
			],
			Container: 'ts',
			Type: MediaTypes.Video
		},
		...BaseProfile.CodecProfiles
	],
	DirectPlayProfiles: [
		{
			AudioCodec: 'aac,mp3,dca,dts,alac',
			Container: 'mp4,m4v',
			Type: MediaTypes.Video,
			VideoCodec: 'h264,vc1'
		},
		{
			AudioCodec: 'aac,mp3,dca,dts,alac',
			Container: 'mov',
			Type: MediaTypes.Video,
			VideoCodec: 'h264'
		},
		{
			Container: 'mp3',
			Type: MediaTypes.Audio
		},
		{
			Container: 'aac',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'aac',
			Container: 'm4a',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'aac',
			Container: 'm4b',
			Type: MediaTypes.Audio
		},
		{
			Container: 'alac',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'alac',
			Container: 'm4a',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'alac',
			Container: 'm4b',
			Type: MediaTypes.Audio
		},
		{
			Container: 'wav',
			Type: MediaTypes.Audio
		}
	],
	TranscodingProfiles: [
		{
			AudioCodec: 'aac',
			BreakOnNonKeyFrames: true,
			Container: 'aac',
			Context: 'Streaming',
			MaxAudioChannels: '6',
			MinSegments: '2',
			Protocol: 'hls',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'aac',
			Container: 'aac',
			Context: 'Streaming',
			MaxAudioChannels: '6',
			Protocol: 'http',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'mp3',
			Container: 'mp3',
			Context: 'Streaming',
			MaxAudioChannels: '6',
			Protocol: 'http',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'wav',
			Container: 'wav',
			Context: 'Streaming',
			MaxAudioChannels: '6',
			Protocol: 'http',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'mp3',
			Container: 'mp3',
			Context: 'Static',
			MaxAudioChannels: '6',
			Protocol: 'http',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'aac',
			Container: 'aac',
			Context: 'Static',
			MaxAudioChannels: '6',
			Protocol: 'http',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'wav',
			Container: 'wav',
			Context: 'Static',
			MaxAudioChannels: '6',
			Protocol: 'http',
			Type: MediaTypes.Audio
		},
		{
			AudioCodec: 'aac,mp3',
			BreakOnNonKeyFrames: true,
			Container: 'ts',
			Context: 'Streaming',
			MaxAudioChannels: '6',
			MinSegments: '2',
			Protocol: 'hls',
			Type: MediaTypes.Video,
			VideoCodec: 'h264'
		},
		{
			AudioCodec: 'aac,mp3,dca,dts,alac',
			Container: 'mp4',
			Context: 'Static',
			Protocol: 'http',
			Type: MediaTypes.Video,
			VideoCodec: 'h264'
		}
	]
};
