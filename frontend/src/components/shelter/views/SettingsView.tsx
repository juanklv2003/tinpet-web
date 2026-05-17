import { Sun, Moon, Desktop, Translate, Database, WarningOctagon } from '@phosphor-icons/react';
import { useTranslation } from '../../../i18n/useTranslation';
import { useI18n } from '../../../i18n/I18nContext';
import type { Locale } from '../../../i18n/I18nContext';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../../dashboard/ToastProvider';

export function SettingsView() {
  const t = useTranslation();
  const { locale, setLocale } = useI18n();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { showToast } = useToast();

  const handleTheme = (mode: 'light' | 'dark' | 'system') => {
    if (mode === 'dark') {
      if (!isDarkMode) toggleDarkMode();
      showToast(t('settings.theme.darkToast'));
    } else if (mode === 'light') {
      if (isDarkMode) toggleDarkMode();
      showToast(t('settings.theme.lightToast'));
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark !== isDarkMode) toggleDarkMode();
      showToast(t('settings.theme.systemToast'));
    }
  };

  const handleLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    showToast(t('settings.language.successToast'));
  };

  const themeOptions = [
    { key: 'light' as const, icon: <Sun size={20} weight="bold" />, label: t('settings.theme.light') },
    { key: 'dark'  as const, icon: <Moon size={20} weight="bold" />, label: t('settings.theme.dark') },
    { key: 'system' as const, icon: <Desktop size={20} weight="bold" />, label: t('settings.theme.system') },
  ];

  return (
    <section className="max-w-4xl mx-auto animate-bento-in">
      {/* Header */}
      <header className="mb-12">
        <p className="text-brand-500 font-bold tracking-widest uppercase text-xs mb-3">
          {t('nav.system')}
        </p>
        <h2 className="font-serif text-4xl md:text-5xl text-ink-dark dark:text-white leading-tight">
          {t('settings.title')}
        </h2>
        <p className="text-ink-medium dark:text-slate-400 mt-3 font-medium text-sm">
          {t('settings.subtitle')}
        </p>
      </header>

      <div className="space-y-6">
        {/* Theme */}
        <div className="bento-item bg-surface dark:bg-slate-800 rounded-3xl p-8 shadow-bento border border-white dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-background dark:bg-slate-900 rounded-2xl flex items-center justify-center text-brand-500 shrink-0">
              <Sun size={24} weight="fill" />
            </div>
            <div>
              <h4 className="font-serif text-xl text-ink-dark dark:text-white">
                {t('settings.theme.title')}
              </h4>
              <p className="text-sm text-ink-light dark:text-slate-400 mt-0.5">
                {t('settings.theme.subtitle')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleTheme(opt.key)}
                className="flex items-center justify-center gap-3 p-4 rounded-xl border border-ink-light/20 dark:border-slate-600 bg-white dark:bg-slate-900 text-ink-dark dark:text-white font-bold text-sm hover:border-brand-500 dark:hover:border-brand-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bento-item bg-surface dark:bg-slate-800 rounded-3xl p-8 shadow-bento border border-white dark:border-slate-700 transition-colors" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-background dark:bg-slate-900 rounded-2xl flex items-center justify-center text-brand-500 shrink-0">
              <Translate size={24} weight="fill" />
            </div>
            <div>
              <h4 className="font-serif text-xl text-ink-dark dark:text-white">
                {t('settings.language.title')}
              </h4>
              <p className="text-sm text-ink-light dark:text-slate-400 mt-0.5">
                {t('settings.language.subtitle')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {(['es', 'en'] as Locale[]).map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLocale(lang)}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  locale === lang
                    ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                    : 'border-ink-light/20 dark:border-slate-600 bg-white dark:bg-slate-900 text-ink-dark dark:text-white hover:border-brand-500 dark:hover:border-brand-400'
                }`}
              >
                <span>{lang === 'es' ? '🇪🇸' : '🇬🇧'}</span>
                <span>{t(`settings.language.${lang}` as any)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="bento-item bg-surface dark:bg-slate-800 rounded-3xl p-8 shadow-bento border border-white dark:border-slate-700 transition-colors" style={{ animationDelay: '120ms' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-background dark:bg-slate-900 rounded-2xl flex items-center justify-center text-brand-500 shrink-0">
                <Database size={24} weight="fill" />
              </div>
              <div>
                <h4 className="font-serif text-xl text-ink-dark dark:text-white">
                  {t('settings.export.title')}
                </h4>
                <p className="text-sm text-ink-light dark:text-slate-400 mt-1 max-w-md">
                  {t('settings.export.subtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast(t('settings.export.toast'))}
              className="whitespace-nowrap flex items-center gap-2 bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 hover:border-brand-500 dark:hover:border-brand-400 text-ink-dark dark:text-white px-6 py-3 rounded-xl text-sm font-bold transition-all"
            >
              {t('settings.export.btn')}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bento-item bg-red-50/50 dark:bg-red-900/10 rounded-3xl p-8 border border-red-100 dark:border-red-900/30 transition-colors" style={{ animationDelay: '180ms' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-red-500 shrink-0 shadow-sm border border-red-100 dark:border-slate-800">
                <WarningOctagon size={24} weight="fill" />
              </div>
              <div>
                <h4 className="font-serif text-xl text-red-600 dark:text-red-400">
                  {t('settings.danger.title')}
                </h4>
                <p className="text-sm text-red-500/80 dark:text-red-400/80 mt-1 max-w-md">
                  {t('settings.danger.subtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast(t('settings.danger.cancelToast'))}
              className="whitespace-nowrap flex items-center gap-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              {t('settings.danger.btn')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
