import * as DropdownMenu from "zeego/dropdown-menu";
import { Text } from "@/components/common/Text";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { TouchableOpacity, View, ViewProps } from "react-native";

interface Props extends ViewProps {
  collectionId: string;
  queryFn: (params: any) => Promise<any>;
  queryKey: string;
  set: (value: string[]) => void;
  values: string[];
  title: string;
}

export const FilterButton: React.FC<Props> = ({
  collectionId,
  queryFn,
  queryKey,
  set,
  values,
  title,
  ...props
}) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: filters } = useQuery<string[]>({
    queryKey: [queryKey, collectionId],
    queryFn,
    staleTime: 0,
  });

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <TouchableOpacity>
          <View
            className={`
            px-3 py-2 rounded-full flex flex-row items-center space-x-2
            ${values.length > 0 ? "bg-purple-600" : "bg-neutral-900"}
            `}
            {...props}
          >
            <Text>{title}</Text>
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
        {filters?.map((g) => (
          <DropdownMenu.CheckboxItem
            value={values.includes(g)}
            onValueChange={(next, previous) => {
              if (next === "on") {
                set([...values, g]);
              } else {
                set(values.filter((v) => v !== g));
              }
            }}
            key={g}
            textValue={g}
          >
            <DropdownMenu.ItemIndicator />
          </DropdownMenu.CheckboxItem>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
