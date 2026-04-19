import { MessageSquare, Search, ShieldCheck, Users } from 'lucide-react';

export function LandingFeatures() {
  const features = [
    {
      icon: <Search className="h-6 w-6 text-pink-500" />,
      title: 'Búsqueda Inteligente',
      description: 'Encuentra a tu compañero ideal mediante filtros avanzados de especie, edad y carácter.',
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-pink-500" />,
      title: 'Chat en Tiempo Real',
      description: 'Comunícate directamente con los refugios para resolver dudas de forma rápida.',
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-pink-500" />,
      title: 'Adopción Segura',
      description: 'Plataforma verificada para garantizar el bienestar animal y la seguridad de las familias.',
    },
    {
      icon: <Users className="h-6 w-6 text-pink-500" />,
      title: 'Red de Refugios',
      description: 'Conecta con cientos de protectoras y veterinarias en una sola aplicación centralizada.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <div 
          key={index}
          className="group flex flex-col items-center text-center rounded-[2rem] border border-stone-200 bg-white p-8 transition-all hover:border-pink-200 hover:shadow-xl hover:shadow-pink-500/5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 dark:bg-pink-900/20 transition-transform group-hover:scale-110 group-hover:rotate-3">
            {feature.icon}
          </div>
          <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
            {feature.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
