import { View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { PropsWithChildren } from "react";

interface Props extends ViewProps {}

export const List: React.FC<PropsWithChildren<Props>> = ({
  children,
  ...props
}) => {
  return (
    <View
      className="flex flex-col rounded-xl overflow-hidden border-neutral-800 divide-y-2 divide-solid divide-neutral-800"
      {...props}
    >
      {children}
    </View>
  );
};
