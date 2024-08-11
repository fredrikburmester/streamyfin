import React from "react";
import { TextInputProps, TextProps } from "react-native";
import { TextInput } from "react-native";
export function Input(props: TextInputProps) {
  const { style, ...otherProps } = props;

  return (
    <TextInput
      className="p-4 border border-neutral-800 rounded-xl bg-neutral-900"
      allowFontScaling={false}
      style={[{ color: "white" }, style]}
      {...otherProps}
      placeholderTextColor={"#9CA3AF"}
    />
  );
}
