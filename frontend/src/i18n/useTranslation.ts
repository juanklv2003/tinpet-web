import { useI18n } from './I18nContext';
import esMessages from './locales/es.json';
import enMessages from './locales/en.json';

type Messages = typeof esMessages;
type NestedKeyOf<T extends object> = {
  [K in keyof T & string]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & string];

type TranslationKey = NestedKeyOf<Messages>;

const locales = {
  es: esMessages,
  en: enMessages,
} as const;

/**
 * Resolves a dot-notation path in a nested object.
 * e.g. get("monitoring.title", messages) → "Monitorización"
 */
function get(path: string, obj: Record<string, unknown>): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : path;
}

/**
 * Replaces {{variable}} placeholders with values from the params object.
 * e.g. t("monitoring.tasks.subtitle", { done: 1, count: 2 }) → "1 de 2 marcadas para hoy."
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`
  );
}

/**
 * useTranslation — returns a `t()` function scoped to the active locale.
 *
 * Usage:
 *   const t = useTranslation();
 *   t('monitoring.title')               // → "Monitorización"
 *   t('monitoring.tasks.subtitle', { done: 1, count: 2 })
 */
export function useTranslation() {
  const { locale } = useI18n();
  const messages = locales[locale] as unknown as Record<string, unknown>;

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const raw = get(key, messages);
    return interpolate(raw, params);
  }

  return t;
}
