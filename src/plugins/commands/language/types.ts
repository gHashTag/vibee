export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  available: boolean;
}

export interface UserLanguage {
  userId: string;
  languageCode: string;
  lastChanged: string;
}

export interface LanguageContext {
  chatId: string;
  userId: string;
  targetLang?: string;
}

export interface LanguageResult {
  success: boolean;
  data?: Language | UserLanguage | Language[];
  error?: string;
}
