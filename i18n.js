import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import en from './translations/en.json';
import ru from './translations/ru.json';

const translations = {
    en,
    ru,
};

const i18n = new I18n(translations);

// Set the locale once at the beginning of your app.
i18n.locale = getLocales()[0].languageCode ?? 'en';

// When a value is missing from a language it'll fallback to another language with the key present.
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
