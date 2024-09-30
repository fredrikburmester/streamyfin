import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./translations/en.json";
import fr from "./translations/fr.json";
import sv from "./translations/sv.json";
import { I18nManager } from 'react-native';
import { getLocales } from "expo-localization";

const locale = getLocales()[0]
export const isRTL = locale?.textDirection === "rtl"
I18nManager.forceRTL(isRTL);

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    sv: { translation: sv },
  },

  lng: locale.languageTag,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
