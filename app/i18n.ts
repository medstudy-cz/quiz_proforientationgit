import { getRequestConfig } from 'next-intl/server';

const loadMessages = {
  en: () => import("../locales/en/common.json").then((m) => m.default),
  ru: () => import("../locales/ru/common.json").then((m) => m.default),
  ua: () => import("../locales/ua/common.json").then((m) => m.default),
} as const;

type AppLocale = keyof typeof loadMessages;

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = (locale ?? "ua") as AppLocale;
  const loader = loadMessages[currentLocale] ?? loadMessages.ua;
  const messages = await loader();

  return { locale: currentLocale, messages };
});
