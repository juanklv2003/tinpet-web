import { ArrowRight, Heart, MapPin, PawPrint } from 'lucide-react';

interface LandingHeroProps {
  entered: boolean;
  onRegister: () => void;
}

export function LandingHero({ entered, onRegister }: LandingHeroProps) {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
      {/* LEFT COLUMN: Copy & CTA */}
      <div
        className={`flex flex-col items-start transition-all duration-700 ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="mb-6 flex flex-wrap gap-2 text-[10px] font-bold tracking-widest text-pink-500 uppercase">
          <span>Para Refugios</span>
          <span className="text-stone-300 dark:text-gray-600">•</span>
          <span>Adoptantes</span>
          <span className="text-stone-300 dark:text-gray-600">•</span>
          <span>Veterinarias</span>
        </div>

        <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-[4rem] text-slate-900 dark:text-white mb-6">
          La plataforma que conecta a animales con su{' '}
          <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
            familia
          </span>.
        </h1>

        <p className="max-w-xl text-lg text-slate-600 dark:text-gray-300 leading-relaxed mb-8">
          Sistema centralizado de gestión de adopciones. Monitoreo en tiempo real, 
          seguimiento de solicitudes y comunicación directa sin complicaciones.
        </p>

        <button
          type="button"
          onClick={onRegister}
          className="group flex items-center justify-center gap-2 rounded-full bg-pink-500 px-8 py-3.5 text-base font-bold text-white transition-all hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/20 active:scale-95"
        >
          Crear cuenta gratis
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* RIGHT COLUMN: Floating Illustration */}
      <div
        className={`relative transition-all delay-200 duration-700 ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="relative mx-auto w-full max-w-md">
          {/* Main Card */}
          <div className="relative z-10 overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 backdrop-blur-xl shadow-2xl shadow-stone-200/50 dark:border-gray-700 dark:bg-gray-800/90 dark:shadow-none p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-gray-700">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500">
                  Mascota del día
                </p>
                <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                  Kira · Golden Retriever
                </p>
              </div>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400">
                Disponible
              </span>
            </div>

            {/* Illustration */}
            <div className="relative flex flex-col items-center justify-center py-8">
              <div className="dog-float relative">
                <img
                  src="/dog-hero.png"
                  alt="Kira, Golden Retriever"
                  className="h-48 w-48 object-contain drop-shadow-xl sm:h-56 sm:w-56"
                  draggable={false}
                />
              </div>
              {/* Sombra */}
              <div className="dog-shadow mt-4 h-3 w-32 rounded-full bg-amber-900/10 blur-md dark:bg-black/50" />
            </div>

            {/* Tags below */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                <MapPin className="h-3.5 w-3.5 text-pink-400" />
                Refugio Costa Animal
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                <PawPrint className="h-3.5 w-3.5 text-pink-400" />
                Carácter tranquilo
              </span>
            </div>
          </div>

          {/* Floating notification */}
          <div className="absolute -right-2 -top-6 sm:-right-6 sm:-top-6 z-20 animate-[fade-in_0.5s_ease_0.8s_both] rounded-2xl border border-stone-200 bg-white p-4 shadow-xl dark:border-gray-600 dark:bg-gray-800 xl:-right-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                <Heart className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">¡Match encontrado!</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Solicitud aprobada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
