import { useAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  BaseItemDto,
} from "@jellyfin/sdk/lib/generated-client/models";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Text } from "./common/Text";
import { Button } from "./Button";
import { EpisodeCard } from "./downloads/EpisodeCard";
import { toast } from "sonner-native";

interface EpisodeListProps {
  showId: string;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({ showId }) => {
  const [api] = useAtom(apiAtom);
  const [selectedEpisode, setSelectedEpisode] = useState<BaseItemDto | null>(null);
  
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback((episode: BaseItemDto) => {
    setSelectedEpisode(episode);
    bottomSheetModalRef.current?.present();
  }, []);

  const closeModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const renderEpisode = useCallback(
    ({ item }: { item: BaseItemDto }) => (
      <TouchableOpacity onPress={() => handlePresentModalPress(item)}>
       {/* <EpisodeCard item={item} key={index} /> */}
      </TouchableOpacity>
    ),
    [handlePresentModalPress]
  );

  return (
  <View style={styles.container}>
    <View>
        <Text style={{
          fontSize: 30,
          top: 5,
          left: 5,
          color: "#C162E1",
        }}>Series name - Episodes</Text>
        <View style={styles.separator} />
      </View>


      <BottomSheetModal
        ref={bottomSheetModalRef}
        enableDynamicSizing
        handleIndicatorStyle={{
          backgroundColor: "white",
        }}
        backgroundStyle={{
          backgroundColor: "#171717",
        }}
        onChange={() => {}}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        <BottomSheetView>
          <View className="flex flex-col space-y-4 px-4 pb-8 pt-2">
            {selectedEpisode && (
              <>
                <Text className="font-bold text-2xl text-neutral-10">
                  {selectedEpisode.Name}
                </Text>
                <Text className="text-neutral-500">
                  {selectedEpisode.Overview}
                </Text>
                <Button
                  onPress={() => {
                    toast.success(`Playing ${selectedEpisode.Name}`);
                    closeModal();
                  }}
                  color="purple"
                >
                  Play Episode
                </Button>
              </>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: '50%',
    left: '50%',
    width: 550,
    height: 205,
    backgroundColor: '#171717',
    transform: [{ translateX: -300 }, { translateY: 100 }], 
    marginTop: -100, 
    marginLeft: -250,
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
  },
  separator: {
    height: 3, 
    backgroundColor: '#CCCCCC', 
    marginVertical: 10,
  }
});


{/*Idea https://github.com/Namo2/InPlayerEpisodePreview/tree/master */}