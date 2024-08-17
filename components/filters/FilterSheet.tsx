import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Text } from "@/components/common/Text";
import { StyleSheet, TouchableOpacity, View, ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../Button";
import { Input } from "../common/Input";

interface Props<T> extends ViewProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: T[] | null;
  values: T[];
  set: (value: T[]) => void;
  title: string;
  searchFilter: (item: T, query: string) => boolean;
  renderItemLabel: (item: T) => React.ReactNode;
  showSearch?: boolean;
}

const LIMIT = 100;

export const FilterSheet = <T,>({
  values,
  data: _data,
  open,
  set,
  setOpen,
  title,
  searchFilter,
  renderItemLabel,
  showSearch = true,
  ...props
}: Props<T>) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["80%"], []);

  const [data, setData] = useState<T[]>([]);
  const [offset, setOffset] = useState<number>(0);

  const [search, setSearch] = useState<string>("");

  const filteredData = useMemo(() => {
    if (!search) return _data;
    const results = [];
    for (let i = 0; i < (_data?.length || 0); i++) {
      if (_data && searchFilter(_data[i], search)) {
        results.push(_data[i]);
      }
    }
    return results.slice(0, 100);
  }, [search, _data, searchFilter]);

  useEffect(() => {
    if (!_data || _data.length === 0) return;
    const tmp = new Set(data);
    for (let i = offset; i < Math.min(_data.length, offset + LIMIT); i++) {
      tmp.add(_data[i]);
    }
    setData(Array.from(tmp));
  }, [offset, _data]);

  useEffect(() => {
    if (open) bottomSheetModalRef.current?.present();
    else bottomSheetModalRef.current?.dismiss();
  }, [open]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setOpen(false);
    }
  }, []);

  const renderData = useMemo(() => {
    if (search.length > 0 && showSearch) return filteredData;
    return data;
  }, [search, filteredData, data]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: "white",
      }}
      backgroundStyle={{
        backgroundColor: "#171717",
      }}
      style={{}}
    >
      <BottomSheetScrollView
        style={{
          flex: 1,
        }}
      >
        <View className="px-4 mt-2 mb-8">
          <Text className="font-bold text-2xl">{title}</Text>
          <Text className="mb-2 text-neutral-500">{_data?.length} items</Text>
          {showSearch && (
            <Input
              placeholder="Search..."
              className="my-2"
              value={search}
              onChangeText={(text) => {
                setSearch(text);
              }}
              returnKeyType="done"
            />
          )}
          <View
            style={{
              borderRadius: 20,
              overflow: "hidden",
            }}
            className="mb-4 flex flex-col rounded-xl overflow-hidden"
          >
            {renderData?.map((item, index) => (
              <>
                <TouchableOpacity
                  onPress={() => {
                    set(
                      values.includes(item)
                        ? values.filter((i) => i !== item)
                        : [item]
                    );
                    setTimeout(() => {
                      setOpen(false);
                    }, 250);
                  }}
                  key={index}
                  className=" bg-neutral-800 px-4 py-3 flex flex-row items-center justify-between"
                >
                  <Text>{renderItemLabel(item)}</Text>
                  {values.includes(item) ? (
                    <Ionicons name="radio-button-on" size={24} color="white" />
                  ) : (
                    <Ionicons name="radio-button-off" size={24} color="white" />
                  )}
                </TouchableOpacity>
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                  }}
                  className="h-1 divide-neutral-700 "
                ></View>
              </>
            ))}
          </View>
          {data.length < (_data?.length || 0) && (
            <Button
              onPress={() => {
                setOffset(offset + 100);
              }}
            >
              Load more
            </Button>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};
