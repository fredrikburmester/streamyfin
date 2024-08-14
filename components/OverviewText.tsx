import { TouchableOpacity, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { tc } from "@/utils/textTools";
import { useState } from "react";

interface Props extends ViewProps {
  text?: string | null;
}

const LIMIT = 150;

export const OverviewText: React.FC<Props> = ({ text, ...props }) => {
  const [limit, setLimit] = useState(LIMIT);

  if (!text) return null;

  if (text.length > LIMIT)
    return (
      <TouchableOpacity
        onPress={() =>
          setLimit((prev) => (prev === LIMIT ? text.length : LIMIT))
        }
      >
        <View {...props} className="">
          <Text>{tc(text, limit)}</Text>
          <Text className="text-purple-600 mt-1">
            {limit === LIMIT ? "Show more" : "Show less"}
          </Text>
        </View>
      </TouchableOpacity>
    );

  return (
    <View {...props}>
      <Text>{text}</Text>
    </View>
  );
};
