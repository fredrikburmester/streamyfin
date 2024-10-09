import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import {
  Pressable,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
} from "react-native";
import { Text } from "../common/Text";

interface Props extends ViewProps {
  title?: string | null | undefined;
  text?: string | null | undefined;
  children?: ReactNode;
  iconAfter?: ReactNode;
  iconBefore?: ReactNode;
  textInputProps?: TextInputProps;
  defaultValue?: string;
  onChange: (text: string) => void;
}

export const ListInputItem: React.FC<PropsWithChildren<Props>> = ({
  title,
  text,
  iconAfter,
  iconBefore,
  children,
  onChange,
  textInputProps,
  defaultValue,
  ...props
}) => {
  const [value, setValue] = useState<string>(defaultValue || "");

  useEffect(() => {
    onChange(value);
  }, [value]);

  return (
    <View
      className={`flex flex-row items-center justify-between px-4 h-12 bg-neutral-900`}
      {...props}
    >
      {iconBefore && <View className="mr-2">{iconBefore}</View>}
      <View>
        <Text className="">{title}</Text>
      </View>
      <View className="ml-auto">
        <TextInput
          inputMode="numeric"
          keyboardType="decimal-pad"
          style={{ color: "white" }}
          value={value}
          onChangeText={setValue}
          className=""
          {...textInputProps}
        />
      </View>
      {iconAfter && <View className="ml-2">{iconAfter}</View>}
    </View>
  );
};
