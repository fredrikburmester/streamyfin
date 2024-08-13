import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  PixelRatio,
  StyleSheet,
  View,
  Button,
  TouchableOpacity,
} from "react-native";

const videoSource =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

interface Props {
  videoSource: string;
}

export const NewVideoPlayer: React.FC<Props> = ({ videoSource }) => {
  const ref = useRef<VideoView | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.play();
  });

  useEffect(() => {
    const subscription = player.addListener("playingChange", (isPlaying) => {
      setIsPlaying(isPlaying);
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  return (
    <TouchableOpacity
      onPress={() => {
        ref.current?.enterFullscreen();
      }}
      className={`relative h-full bg-neutral-800 rounded-md overflow-hidden
      `}
    >
      <VideoView
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
        }}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
      />
    </TouchableOpacity>
  );
};
