import { useFocusEffect } from "expo-router";
import React, { useEffect } from "react";
import { TextInputProps, TextProps } from "react-native";
import { TextInput } from "react-native";
export function Input(props: TextInputProps) {
  const { style, ...otherProps } = props;
  const inputRef = React.useRef<TextInput>(null);

  useFocusEffect(
    React.useCallback(() => {
      inputRef.current?.focus();
    }, []),
  );

  return (
    <TextInput
      ref={inputRef}
      className="p-4 border border-neutral-800 rounded-xl bg-neutral-900"
      allowFontScaling={false}
      style={[{ color: "white" }, style]}
      {...otherProps}
      placeholderTextColor={"#9CA3AF"}
      clearButtonMode="while-editing"
    />
  );
}
