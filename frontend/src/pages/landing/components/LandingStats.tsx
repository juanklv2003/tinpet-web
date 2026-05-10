const stats = [
  { value: '+1.200', label: 'Animales ayudados' },
  { value: '98%', label: 'Índice de éxito' },
  { value: '24/7', label: 'Asistente inteligente' },
  { value: '150+', label: 'Refugios registrados' },
];

export function LandingStats() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y-2 divide-brand/15 lg:divide-y-0 lg:divide-x-2 rounded-2xl border border-brand/20 bg-brand/5 dark:bg-brand/8 dark:border-brand/15 overflow-hidden">
        {stats.map((stat) => (
          <div
            key={stat.value}
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
