import { Text } from "@/components/common/Text";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useState } from "react";
import { TouchableOpacity, View, ViewProps } from "react-native";
import { FilterSheet } from "./FilterSheet";

interface FilterButtonProps<T> extends ViewProps {
  collectionId: string;
  queryFn: (params: any) => Promise<any>;
  queryKey: string;
  set: (value: T[]) => void;
  values: T[];
  title: string;
  searchFilter: (item: T, query: string) => boolean;
  renderItemLabel: (item: T) => React.ReactNode;
  showSearch?: boolean;
}

export const FilterButton = <T,>({
  collectionId,
  queryFn,
  queryKey,
  set,
  values,
  title,
  renderItemLabel,
  searchFilter,
  showSearch = true,
  ...props
}: FilterButtonProps<T>) => {
  const [open, setOpen] = useState(false);

  const { data: filters } = useQuery<T[]>({
    queryKey: [queryKey, collectionId],
    queryFn,
    staleTime: 0,
  });

  if (filters?.length === 0) return null;

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}>
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
      <FilterSheet<T>
        title={title}
        open={open}
        setOpen={setOpen}
        data={filters}
        values={values}
        set={set}
        renderItemLabel={renderItemLabel}
        searchFilter={searchFilter}
        showSearch={showSearch}
      />
    </>
  );
};
