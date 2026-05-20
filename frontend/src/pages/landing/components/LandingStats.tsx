import { useTranslation } from '../../../i18n/useTranslation';

export function LandingStats() {
  const t = useTranslation();

  const stats = [
    { value: '+1.200', label: t('landing.stats.adoptions', { defaultValue: 'Animales ayudados' }) },
    { value: '98%', label: t('landing.stats.success', { defaultValue: 'Índice de éxito' }) },
    { value: '24/7', label: t('landing.stats.assistant', { defaultValue: 'Asistente inteligente' }) },
    { value: '150+', label: t('landing.stats.shelters', { defaultValue: 'Refugios registrados' }) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y-2 divide-stone-200/60 lg:divide-y-0 lg:divide-x-2 rounded-[32px] border border-stone-200/60 dark:border-slate-800 dark:divide-slate-800 bg-white dark:bg-dark-card shadow-sm overflow-hidden transition-colors duration-300">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center px-6 py-10 text-center"
          >
            <p className="mb-1.5 text-4xl sm:text-5xl font-black text-brand">
              {stat.value}
            </p>
            <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
