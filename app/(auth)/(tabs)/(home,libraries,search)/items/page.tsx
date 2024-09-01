import { ItemContent } from "@/components/ItemContent";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

const Page: React.FC = () => {
  const { id } = useLocalSearchParams() as { id: string };

  const memoizedContent = useMemo(() => <ItemContent id={id} />, [id]);

  return memoizedContent;
};

export default React.memo(Page);
