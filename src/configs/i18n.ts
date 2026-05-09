export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ua'],
  langDirection: {
    en: 'ltr',
    ua: 'ltr'
  }
} as const

export type Locale = (typeof i18n)['locales'][number]
