import { TouchableOpacity, View } from "react-native";
import { Text } from "./common/Text";
import { atom, useAtom } from "jotai";

export type Bitrate = {
  key: string;
  value: number | undefined;
};

const BITRATES: Bitrate[] = [
  {
    key: "Max",
    value: undefined,
  },
  {
    key: "8 Mb/s",
    value: 8000000,
  },
  {
    key: "4 Mb/s",
    value: 4000000,
  },
  {
    key: "2 Mb/s",
    value: 2000000,
  },
  {
    key: "500 Kb/s",
    value: 500000,
  },
  {
    key: "250 Kb/s",
    value: 250000,
  },
];

interface Props extends React.ComponentProps<typeof View> {
  onChange: (value: Bitrate) => void;
  selected: Bitrate;
}

export const BitrateSelector: React.FC<Props> = ({
  onChange,
  selected,
  ...props
}) => {
  return (
    <View
      className="flex flex-row items-center justify-between"
      {...props}
    ></View>
  );
};
