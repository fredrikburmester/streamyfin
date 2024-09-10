import { atom, useAtom } from "jotai";

interface ThemeColors {
  primary: string;
  secondary: string;
  average: string;
  text: string;
}

const calculateTextColor = (backgroundColor: string): string => {
  // Convert hex to RGB
  const r = parseInt(backgroundColor.slice(1, 3), 16);
  const g = parseInt(backgroundColor.slice(3, 5), 16);
  const b = parseInt(backgroundColor.slice(5, 7), 16);

  // Calculate perceived brightness
  // Using the formula: (R * 299 + G * 587 + B * 114) / 1000
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Calculate contrast ratio with white and black
  const contrastWithWhite = calculateContrastRatio([255, 255, 255], [r, g, b]);
  const contrastWithBlack = calculateContrastRatio([0, 0, 0], [r, g, b]);

  // Use black text if the background is bright and has good contrast with black
  if (brightness > 180 && contrastWithBlack >= 4.5) {
    return "#000000";
  }

  // Otherwise, use white text
  return "#FFFFFF";
};

// Helper function to calculate contrast ratio
const calculateContrastRatio = (rgb1: number[], rgb2: number[]): number => {
  const l1 = calculateRelativeLuminance(rgb1);
  const l2 = calculateRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Helper function to calculate relative luminance
const calculateRelativeLuminance = (rgb: number[]): number => {
  const [r, g, b] = rgb.map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const isCloseToBlack = (color: string): boolean => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // Check if the color is very dark (close to black)
  return r < 20 && g < 20 && b < 20;
};

const adjustToNearBlack = (color: string): string => {
  return "#212121"; // A very dark gray, almost black
};

const baseThemeColorAtom = atom<ThemeColors>({
  primary: "#FFFFFF",
  secondary: "#000000",
  average: "#888888",
  text: "#000000",
});

export const itemThemeColorAtom = atom(
  (get) => get(baseThemeColorAtom),
  (get, set, update: Partial<ThemeColors>) => {
    const currentColors = get(baseThemeColorAtom);
    let newColors = { ...currentColors, ...update };

    // Adjust primary color if it's too close to black
    if (newColors.primary && isCloseToBlack(newColors.primary)) {
      newColors.primary = adjustToNearBlack(newColors.primary);
    }

    // Recalculate text color if primary color changes
    if (update.primary) newColors.text = calculateTextColor(newColors.primary);

    set(baseThemeColorAtom, newColors);
  }
);

export const useItemThemeColor = () => useAtom(itemThemeColorAtom);
