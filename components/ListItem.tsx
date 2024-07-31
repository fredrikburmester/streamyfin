import { PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";
import { Text } from "./common/Text";

type Props = {
  title?: string | null | undefined;
  subTitle?: string | null | undefined;
  children?: ReactNode;
  iconAfter?: ReactNode;
};

export const ListItem: React.FC<PropsWithChildren<Props>> = ({
  title,
  subTitle,
  iconAfter,
  children,
}) => {
  return (
    <View className="flex flex-row items-center justify-between bg-neutral-900 p-4">
      <View className="flex flex-col">
        <Text className="font-bold ">{title}</Text>
        {subTitle && <Text className="text-xs">{subTitle}</Text>}
      </View>
      {iconAfter}
    </View>
  );
};
