import { TouchableOpacity, View, ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { tc } from "@/utils/textTools";
import { useState } from "react";

interface Props extends ViewProps {
  text?: string | null;
  characterLimit?: number;
}

export const OverviewText: React.FC<Props> = ({
  text,
  characterLimit = 140,
  ...props
}) => {
  const [limit, setLimit] = useState(characterLimit);

  if (!text) return null;

  if (text.length > characterLimit)
    return (
      <TouchableOpacity
        onPress={() =>
          setLimit((prev) =>
            prev === characterLimit ? text.length : characterLimit
          )
        }
        {...props}
      >
        <View {...props} className="">
          <Text>{tc(text, limit)}</Text>
          <Text className="text-purple-600 mt-1">
            {limit === characterLimit ? "Show more" : "Show less"}
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
