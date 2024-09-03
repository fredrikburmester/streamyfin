import { itemThemeColorAtom } from "@/utils/atoms/primaryColor";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { getColors } from "react-native-image-colors";

export const useImageColors = (
  uri: string | undefined | null,
  disabled = false
) => {
  const [, setPrimaryColor] = useAtom(itemThemeColorAtom);

  useEffect(() => {
    if (disabled) return;
    if (uri) {
      getColors(uri, {
        fallback: "#fff",
        cache: true,
        key: uri,
      })
        .then((colors) => {
          let primary: string = "#fff";
          let average: string = "#fff";
          let secondary: string = "#fff";

          if (colors.platform === "android") {
            primary = colors.dominant;
            average = colors.average;
            secondary = colors.muted;
          } else if (colors.platform === "ios") {
            primary = colors.primary;
            secondary = colors.detail;
            average = colors.background;
          }

          setPrimaryColor({
            primary,
            secondary,
            average,
          });
        })
        .catch((error) => {
          console.error("Error getting colors", error);
        });
    }
  }, [uri, setPrimaryColor, disabled]);
};
