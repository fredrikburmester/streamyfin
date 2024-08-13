import { Button } from "./Button";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Feather, Ionicons } from "@expo/vector-icons";
import { runtimeTicksToMinutes } from "@/utils/time";

interface Props extends React.ComponentProps<typeof Button> {
  item: BaseItemDto;
  onPress: () => void;
  chromecastReady: boolean;
}

export const PlayButton: React.FC<Props> = ({
  item,
  onPress,
  chromecastReady,
  ...props
}) => {
  return (
    <Button
      onPress={onPress}
      iconRight={
        chromecastReady ? (
          <Feather name="cast" size={20} color="white" />
        ) : (
          <Ionicons name="play-circle" size={24} color="white" />
        )
      }
      {...props}
    >
      {runtimeTicksToMinutes(item?.RunTimeTicks)}
    </Button>
  );
};
