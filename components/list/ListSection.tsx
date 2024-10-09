import { View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { Children, PropsWithChildren } from "react";

interface Props extends ViewProps {
  title: string;
}

export const ListSection: React.FC<PropsWithChildren<Props>> = ({
  children,
  title,
  ...props
}) => {
  return (
    <View {...props}>
      <Text className="ml-4 mb-1 text-xs text-neutral-500 uppercase">
        {title}
      </Text>
      <View className="flex flex-col rounded-xl overflow-hidden border-neutral-800 divide-y-2 divide-solid divide-neutral-800">
        {children}
      </View>
    </View>
  );
};
