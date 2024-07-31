import React from "react";
import { TextProps } from "react-native";
import { Text as DefaultText } from "react-native";
export function Text(props: TextProps) {
  const { style, ...otherProps } = props;

  return (
    <DefaultText
      allowFontScaling={false}
      style={[{ color: "white" }, style]}
      {...otherProps}
    />
  );
}
