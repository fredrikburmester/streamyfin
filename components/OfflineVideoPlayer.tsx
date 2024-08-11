import React, { useEffect, useRef } from "react";
import Video, { VideoRef } from "react-native-video";

type VideoPlayerProps = {
  url: string;
};

export const OfflineVideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
  const videoRef = useRef<VideoRef | null>(null);

  const onError = (error: any) => {
    console.error("Video Error: ", error);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.resume();
    }
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.presentFullscreenPlayer();
      }
    }, 500);
  }, []);

  return (
    <Video
      source={{
        uri: url,
        isNetwork: false,
      }}
      ref={videoRef}
      onError={onError}
      ignoreSilentSwitch="ignore"
    />
  );
};
