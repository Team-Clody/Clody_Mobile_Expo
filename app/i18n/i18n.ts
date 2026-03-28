import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import ko from "@/locales/ko";
import en from "@/locales/en";

const i18n = new I18n({ ko, en });

// 📌 기기 언어 자동 감지
i18n.locale = Localization.getLocales()[0].languageCode || "en";

// 📌 없는 번역 fallback
i18n.enableFallback = true;

export default i18n;
