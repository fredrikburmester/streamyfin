import { TouchableOpacity, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
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
    <View className="flex flex-row items-center justify-between" {...props}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <View className="flex flex-col mb-2">
            <Text className="opacity-50 mb-1 text-xs">Bitrate</Text>
            <View className="flex flex-row">
              <TouchableOpacity className="bg-neutral-900 h-12 rounded-2xl border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                <Text>
                  {BITRATES.find((b) => b.value === selected.value)?.key}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          loop={true}
          side="bottom"
          align="start"
          alignOffset={0}
          avoidCollisions={true}
          collisionPadding={8}
          sideOffset={8}
        >
          <DropdownMenu.Label>Bitrates</DropdownMenu.Label>
          {BITRATES?.map((b, index: number) => (
            <DropdownMenu.Item
              key={index.toString()}
              onSelect={() => {
                onChange(b);
              }}
            >
              <DropdownMenu.ItemTitle>{b.key}</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  );
};
