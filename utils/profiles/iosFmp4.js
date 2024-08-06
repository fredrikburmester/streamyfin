/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MediaTypes from '../../constants/MediaTypes';

import iOSProfile from './ios';

/**
 * Device profile for Expo Video player on iOS 13+ with fMP4 support
 */
export default {
	...iOSProfile,
	Name: 'Expo iOS fMP4 Video Profile',
	TranscodingProfiles: [
		// Add all audio profiles from default profile
		...iOSProfile.TranscodingProfiles.filter(profile => profile.Type === MediaTypes.Audio),
		// Add fMP4 profile
		{
			AudioCodec: 'aac,mp3,flac,alac',
			BreakOnNonKeyFrames: true,
			Container: 'mp4',
			Context: 'Streaming',
			MaxAudioChannels: '6',
			MinSegments: '2',
			Protocol: 'hls',
			Type: MediaTypes.Video,
			VideoCodec: 'hevc,h264'
		},
		// Add all video profiles from default profile
		...iOSProfile.TranscodingProfiles.filter(profile => profile.Type === MediaTypes.Video)
	]
};

