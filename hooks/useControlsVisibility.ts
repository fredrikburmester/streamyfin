import { useRef, useCallback, useState, useEffect } from "react";

export const useControlsVisibility = (timeout: number = 3000) => {
  const [isVisible, setIsVisible] = useState(true);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const showControls = useCallback(() => {
    setIsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, timeout);
  }, [timeout]);

  const hideControls = useCallback(() => {
    setIsVisible(false);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  return { isVisible, showControls, hideControls };
};
