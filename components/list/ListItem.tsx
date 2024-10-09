import { PropsWithChildren, ReactNode, useState } from "react";
import {
  Pressable,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
} from "react-native";
import { Text } from "../common/Text";

interface Props extends TouchableOpacityProps {
  title?: string | null | undefined;
  text?: string | null | undefined;
  children?: ReactNode;
  iconAfter?: ReactNode;
  iconBefore?: ReactNode;
}

export const ListItem: React.FC<PropsWithChildren<Props>> = ({
  title,
  text,
  iconAfter,
  iconBefore,
  children,
  ...props
}) => {
  return (
    <TouchableOpacity
      className={`flex flex-row items-center justify-between px-4 h-12 bg-neutral-900`}
      {...props}
    >
      {iconBefore && <View className="mr-2">{iconBefore}</View>}
      <View>
        <Text className="">{title}</Text>
      </View>
      <View className="ml-auto">
        <Text selectable className="">
          {text}
        </Text>
      </View>
      {iconAfter && <View className="ml-2">{iconAfter}</View>}
    </TouchableOpacity>
  );
};
