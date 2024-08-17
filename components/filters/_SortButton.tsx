import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "@/components/common/Text";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { TouchableOpacity, View, ViewProps } from "react-native";
import {
  sortByAtom,
  sortOptions,
  sortOrderAtom,
  sortOrderOptions,
} from "@/utils/atoms/filters";

interface Props extends ViewProps {
  title: string;
}

export const SortButton: React.FC<Props> = ({ title, ...props }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [sortBy, setSortBy] = useAtom(sortByAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <TouchableOpacity>
          <View
            className={`
            px-3 py-2 rounded-full flex flex-row items-center space-x-2 bg-neutral-900
            `}
            {...props}
          >
            <Text>Sort by</Text>
            <Ionicons
              name="filter"
              size={16}
              color="white"
              style={{ opacity: 0.5 }}
            />
          </View>
        </TouchableOpacity>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        loop={true}
        side="bottom"
        align="start"
        alignOffset={0}
        avoidCollisions={true}
        collisionPadding={8}
        sideOffset={8}
      >
        {sortOptions?.map((g) => (
          <DropdownMenu.CheckboxItem
            value={sortBy.key === g.key ? "on" : "off"}
            onValueChange={(next, previous) => {
              if (next === "on") {
                setSortBy(g);
              } else {
                setSortBy(sortOptions[0]);
              }
            }}
            key={g.key}
            textValue={g.value}
          >
            <DropdownMenu.ItemIndicator />
          </DropdownMenu.CheckboxItem>
        ))}
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          {sortOrderOptions.map((g) => (
            <DropdownMenu.CheckboxItem
              value={sortOrder.key === g.key ? "on" : "off"}
              onValueChange={(next, previous) => {
                if (next === "on") {
                  setSortOrder(g);
                } else {
                  setSortOrder(sortOrderOptions[0]);
                }
              }}
              key={g.key}
              textValue={g.value}
            >
              <DropdownMenu.ItemIndicator />
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
