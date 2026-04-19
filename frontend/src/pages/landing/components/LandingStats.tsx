export function LandingStats() {
  const stats = [
    { value: '+2.400', label: 'ADOPCIONES GESTIONADAS' },
    { value: '38%', label: 'MENOS TIEMPO DE GESTIÓN' },
    { value: '4.9/5', label: 'VALORACIÓN MEDIA' },
    { value: '500+', label: 'REFUGIOS CONECTADOS' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="flex flex-col items-center justify-center rounded-[2rem] bg-slate-900 px-4 py-10 text-center shadow-xl transition-transform hover:-translate-y-1 dark:bg-black/80"
          >
            <p className="mb-2 text-4xl sm:text-5xl font-black text-white">
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
