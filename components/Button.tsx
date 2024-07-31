import React, { PropsWithChildren, ReactNode } from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";

interface ButtonProps {
  onPress?: () => void;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  children?: string;
  loading?: boolean;
  iconRight?: ReactNode;
}

export const Button: React.FC<PropsWithChildren<ButtonProps>> = ({
  onPress,
  className = "",
  textClassName = "",
  disabled = false,
  loading = false,
  iconRight,
  children,
}) => {
  return (
    <TouchableOpacity
      className={`
        bg-purple-600 p-3 rounded-xl items-center justify-center
        ${disabled ? "bg-neutral-400" : "active:bg-purple-600"}
        ${loading && "opacity-50"}
        ${className}
      `}
      onPress={() => {
        if (!loading && !disabled && onPress) onPress();
      }}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={"white"} size={24} />
      ) : (
        <View className="flex flex-row items-center">
          <Text
            className={`
          text-white font-bold text-base
          ${disabled ? "text-gray-300" : ""}
          ${textClassName}
            ${iconRight ? "mr-2" : ""}
        `}
          >
            {children}
          </Text>
          {iconRight}
        </View>
      )}
    </TouchableOpacity>
  );
};
