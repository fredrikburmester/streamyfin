import React from "react";
import { ScrollView, View, ViewStyle, ActivityIndicator } from "react-native";

interface HorizontalScrollProps<T> {
  data?: T[] | null;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  loadingContainerStyle?: ViewStyle;
}

export function HorizontalScroll<T>({
  data,
  renderItem,
  containerStyle,
  contentContainerStyle,
  loadingContainerStyle,
}: HorizontalScrollProps<T>): React.ReactElement {
  if (!data) {
    return (
      <View
        style={[
          { flex: 1, justifyContent: "center", alignItems: "center" },
          loadingContainerStyle,
        ]}
      >
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      style={containerStyle}
      contentContainerStyle={contentContainerStyle}
    >
      <View className="flex flex-row px-4">
        {data.map((item, index) => (
          <View className="mr-2" key={index}>
            <React.Fragment>{renderItem(item, index)}</React.Fragment>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
