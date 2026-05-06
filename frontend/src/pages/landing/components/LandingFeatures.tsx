import { MessageSquare, Search, ShieldCheck, Users } from 'lucide-react';

export function LandingFeatures() {
  const features = [
    {
      icon: <Search className="h-6 w-6 text-brand" />,
      title: 'Búsqueda Inteligente',
      description: 'Encuentra a tu compañero ideal mediante filtros avanzados de especie, edad y carácter.',
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-brand" />,
      title: 'Chat en Tiempo Real',
      description: 'Comunícate directamente con los refugios para resolver dudas de forma rápida.',
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-brand" />,
      title: 'Adopción Segura',
      description: 'Plataforma verificada para garantizar el bienestar animal y la seguridad de las familias.',
    },
    {
      icon: <Users className="h-6 w-6 text-brand" />,
      title: 'Red de Refugios',
      description: 'Conecta con cientos de protectoras y veterinarias en una sola aplicación centralizada.',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Todo lo que necesitas
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-gray-300">
          Herramientas profesionales para facilitar las adopciones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="group flex flex-col items-start rounded-xl border border-stone-200 bg-white p-6 transition-all hover:border-brand/30 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
              {feature.icon}
            </div>
            <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
