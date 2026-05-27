// 40 języków: 24 oficjalne UE + 16 globalnych najpopularniejszych (bez RTL).
// Każdy ma: code, native name, English name, flag emoji, region.

export const REGIONS = {
  EU: "Europa (UE)",
  EUROPE: "Europa (poza UE)",
  ASIA: "Azja",
  AMERICAS: "Ameryki",
  AFRICA: "Afryka",
};

export const LOCALES = [
  // === UE 24 oficjalne ===
  { code: "pl", native: "Polski", english: "Polish", flag: "🇵🇱", region: REGIONS.EU },
  { code: "en", native: "English", english: "English", flag: "🇬🇧", region: REGIONS.EU },
  { code: "de", native: "Deutsch", english: "German", flag: "🇩🇪", region: REGIONS.EU },
  { code: "fr", native: "Français", english: "French", flag: "🇫🇷", region: REGIONS.EU },
  { code: "es", native: "Español", english: "Spanish", flag: "🇪🇸", region: REGIONS.EU },
  { code: "it", native: "Italiano", english: "Italian", flag: "🇮🇹", region: REGIONS.EU },
  { code: "pt", native: "Português", english: "Portuguese", flag: "🇵🇹", region: REGIONS.EU },
  { code: "nl", native: "Nederlands", english: "Dutch", flag: "🇳🇱", region: REGIONS.EU },
  { code: "sv", native: "Svenska", english: "Swedish", flag: "🇸🇪", region: REGIONS.EU },
  { code: "da", native: "Dansk", english: "Danish", flag: "🇩🇰", region: REGIONS.EU },
  { code: "fi", native: "Suomi", english: "Finnish", flag: "🇫🇮", region: REGIONS.EU },
  { code: "cs", native: "Čeština", english: "Czech", flag: "🇨🇿", region: REGIONS.EU },
  { code: "sk", native: "Slovenčina", english: "Slovak", flag: "🇸🇰", region: REGIONS.EU },
  { code: "hu", native: "Magyar", english: "Hungarian", flag: "🇭🇺", region: REGIONS.EU },
  { code: "ro", native: "Română", english: "Romanian", flag: "🇷🇴", region: REGIONS.EU },
  { code: "bg", native: "Български", english: "Bulgarian", flag: "🇧🇬", region: REGIONS.EU },
  { code: "hr", native: "Hrvatski", english: "Croatian", flag: "🇭🇷", region: REGIONS.EU },
  { code: "sl", native: "Slovenščina", english: "Slovenian", flag: "🇸🇮", region: REGIONS.EU },
  { code: "et", native: "Eesti", english: "Estonian", flag: "🇪🇪", region: REGIONS.EU },
  { code: "lv", native: "Latviešu", english: "Latvian", flag: "🇱🇻", region: REGIONS.EU },
  { code: "lt", native: "Lietuvių", english: "Lithuanian", flag: "🇱🇹", region: REGIONS.EU },
  { code: "el", native: "Ελληνικά", english: "Greek", flag: "🇬🇷", region: REGIONS.EU },
  { code: "ga", native: "Gaeilge", english: "Irish", flag: "🇮🇪", region: REGIONS.EU },
  { code: "mt", native: "Malti", english: "Maltese", flag: "🇲🇹", region: REGIONS.EU },

  // === Reszta Europy ===
  { code: "uk", native: "Українська", english: "Ukrainian", flag: "🇺🇦", region: REGIONS.EUROPE },
  { code: "ru", native: "Русский", english: "Russian", flag: "🇷🇺", region: REGIONS.EUROPE },
  { code: "no", native: "Norsk", english: "Norwegian", flag: "🇳🇴", region: REGIONS.EUROPE },
  { code: "tr", native: "Türkçe", english: "Turkish", flag: "🇹🇷", region: REGIONS.EUROPE },

  // === Azja ===
  { code: "zh", native: "中文", english: "Chinese (Mandarin)", flag: "🇨🇳", region: REGIONS.ASIA },
  { code: "ja", native: "日本語", english: "Japanese", flag: "🇯🇵", region: REGIONS.ASIA },
  { code: "ko", native: "한국어", english: "Korean", flag: "🇰🇷", region: REGIONS.ASIA },
  { code: "hi", native: "हिन्दी", english: "Hindi", flag: "🇮🇳", region: REGIONS.ASIA },
  { code: "bn", native: "বাংলা", english: "Bengali", flag: "🇧🇩", region: REGIONS.ASIA },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian", flag: "🇮🇩", region: REGIONS.ASIA },
  { code: "vi", native: "Tiếng Việt", english: "Vietnamese", flag: "🇻🇳", region: REGIONS.ASIA },
  { code: "th", native: "ไทย", english: "Thai", flag: "🇹🇭", region: REGIONS.ASIA },
  { code: "ms", native: "Bahasa Melayu", english: "Malay", flag: "🇲🇾", region: REGIONS.ASIA },
  { code: "tl", native: "Tagalog", english: "Tagalog (Filipino)", flag: "🇵🇭", region: REGIONS.ASIA },

  // === Afryka ===
  { code: "sw", native: "Kiswahili", english: "Swahili", flag: "🇰🇪", region: REGIONS.AFRICA },
  { code: "af", native: "Afrikaans", english: "Afrikaans", flag: "🇿🇦", region: REGIONS.AFRICA },
];

// CJK języki — wymagają Noto Sans CJK font (handled w index.css + LanguageSwitcher)
export const CJK_LOCALES = ["zh", "ja", "ko"];

// Języki używające skryptów innych niż łaciński — może wymagać większego line-height
export const NON_LATIN = ["zh", "ja", "ko", "hi", "bn", "th", "el", "bg", "uk", "ru"];

export const DEFAULT_LOCALE = "pl";
export const FALLBACK_LOCALE = "en";

export const SUPPORTED_CODES = LOCALES.map((l) => l.code);

export function getLocale(code) {
  return LOCALES.find((l) => l.code === code) || LOCALES.find((l) => l.code === DEFAULT_LOCALE);
}
