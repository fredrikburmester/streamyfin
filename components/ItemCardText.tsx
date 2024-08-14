import React from "react";
import { View } from "react-native";
import { Text } from "./common/Text";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

type ItemCardProps = {
  item: BaseItemDto;
};

function seasonNameToIndex(seasonName: string | null | undefined) {
  if (!seasonName) return -1;
  if (seasonName.startsWith("Season")) {
    return parseInt(seasonName.replace("Season ", ""));
  }
  if (seasonName.startsWith("Specials")) {
    return 0;
  }
  return -1;
}

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
            {`S${seasonNameToIndex(
              item?.SeasonName,
            )}:E${item.IndexNumber?.toString()}`}{" "}
            {item.Name}
          </Text>
        </>
      ) : (
        <>
          <Text>{item.Name}</Text>
          <Text className="text-xs opacity-50">{item.ProductionYear}</Text>
        </>
      )}
    </View>
  );
};
