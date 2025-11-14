import nlTranslations from '@/locales/nl';
import enTranslations from '@/locales/en';

export type Locale = 'nl' | 'en';

const translations = {
  nl: nlTranslations,
  en: enTranslations,
};

export const useI18n = () => {
  const locale = useState<Locale>('locale', () => 'nl');

  // Load locale from localStorage on mount
  onMounted(() => {
    if (import.meta.client) {
      const savedLocale = localStorage.getItem('locale') as Locale | null;
      if (savedLocale && (savedLocale === 'nl' || savedLocale === 'en')) {
        locale.value = savedLocale;
      }
    }
  });

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale.value];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  const setLocale = (newLocale: Locale) => {
    locale.value = newLocale;
    if (import.meta.client) {
      localStorage.setItem('locale', newLocale);
    }
  };

  return {
    locale: readonly(locale),
    t,
    setLocale,
  };
};
