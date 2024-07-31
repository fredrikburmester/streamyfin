import React from "react";
import { View } from "react-native";
import { Text } from "./common/Text";

type ItemCardProps = {
  item: any;
};

export const ItemCardText: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <View className="mt-2 flex flex-col grow-0">
      {item.Type === "Episode" ? (
        <>
          <Text className="">{item.SeriesName}</Text>
          <Text
            style={{ flexWrap: "wrap" }}
            className="flex text-xs opacity-50 break-all"
          >
            {`S${item.SeasonName?.replace("Season ", "").padStart(
              2,
              "0"
            )}:E${item.IndexNumber.toString().padStart(2, "0")}`}{" "}
            {item.Name}
          </Text>
        </>
      ) : (
        <>
          <Text>{item.Name}</Text>
          <Text></Text>
        </>
      )}
    </View>
  );
};
