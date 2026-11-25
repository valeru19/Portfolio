export type Lang = "ru" | "en";

export type LocalizedString = {
  ru: string;
  en: string;
};

export type LocalizedStringList = {
  ru: string[];
  en: string[];
};

export type Localizable = LocalizedString | LocalizedStringList | string;
