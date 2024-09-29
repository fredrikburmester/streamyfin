import { ItemContent } from "@/components/ItemContent";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

const Page: React.FC = () => {
  const { id } = useLocalSearchParams() as { id: string };

  return (
    <>
      <Stack.Screen options={{ autoHideHomeIndicator: true }} />
      <ItemContent id={id} />
    </>
  );
};

export default Page;
