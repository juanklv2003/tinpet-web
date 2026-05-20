import { MessageSquare, Search, ShieldCheck, Users, ClipboardList, BarChart2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';

export function LandingFeatures() {
  const t = useTranslation();

  const features = [
    {
      icon: Search,
      title: t('landing.features.searchTitle'),
      description: t('landing.features.searchDesc'),
    },
    {
      icon: MessageSquare,
      title: t('landing.features.chatTitle'),
      description: t('landing.features.chatDesc'),
    },
    {
      icon: ShieldCheck,
      title: t('landing.features.securityTitle'),
      description: t('landing.features.securityDesc'),
    },
    {
      icon: Users,
      title: t('landing.features.networkTitle'),
      description: t('landing.features.networkDesc'),
    },
    {
      icon: ClipboardList,
      title: t('landing.features.trackingTitle'),
      description: t('landing.features.trackingDesc'),
    },
    {
      icon: BarChart2,
      title: t('landing.features.rolesTitle'),
      description: t('landing.features.rolesDesc'),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-center">
        <h2
          className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          {t('landing.features.title')}
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          {t('landing.features.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group flex flex-col items-start rounded-xl border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-[border-color,box-shadow] duration-200 hover:border-brand/30 hover:shadow-md dark:hover:border-brand/30"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 transition-[box-shadow] duration-200 group-hover:shadow-[0_0_0_4px_rgba(206,73,152,0.12)]">
                <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
