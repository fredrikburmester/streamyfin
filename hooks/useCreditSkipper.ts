import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { apiAtom } from "@/providers/JellyfinProvider";
import { getAuthHeaders } from "@/utils/jellyfin/jellyfin";
import { writeToLog } from "@/utils/log";

interface CreditTimestamps {
  Introduction: {
    Start: number;
    End: number;
    Valid: boolean;
  };
  Credits: {
    Start: number;
    End: number;
    Valid: boolean;
  };
}

export const useCreditSkipper = (
  itemId: string | undefined,
  currentTime: number,
  videoRef: React.RefObject<any>
) => {
  const [api] = useAtom(apiAtom);
  const [showSkipCreditButton, setShowSkipCreditButton] = useState(false);

  const { data: creditTimestamps } = useQuery<CreditTimestamps | null>({
    queryKey: ["creditTimestamps", itemId],
    queryFn: async () => {
      if (!itemId) {
        console.log("No item id");
        return null;
      }

      const res = await api?.axiosInstance.get(
        `${api.basePath}/Episode/${itemId}/Timestamps`,
        {
          headers: getAuthHeaders(api),
        }
      );

      if (res?.status !== 200) {
        return null;
      }

      return res?.data;
    },
    enabled: !!itemId,
  });

  useEffect(() => {
    if (creditTimestamps) {
      setShowSkipCreditButton(
        currentTime > creditTimestamps.Credits.Start &&
          currentTime < creditTimestamps.Credits.End
      );
    }
  }, [creditTimestamps, currentTime]);

  const skipCredit = useCallback(() => {
    if (!creditTimestamps || !videoRef.current) return;
    try {
      videoRef.current.seek(creditTimestamps.Credits.End);
    } catch (error) {
      writeToLog("ERROR", "Error skipping intro", error);
    }
  }, [creditTimestamps, videoRef]);

  return { showSkipCreditButton, skipCredit };
};
