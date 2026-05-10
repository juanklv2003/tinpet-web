import { ArrowRight, Heart, MapPin, PawPrint, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface LandingHeroProps {
  entered: boolean;
  onRegister: () => void;
}

export function LandingHero({ entered, onRegister }: LandingHeroProps) {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
      {/* LEFT: Copy & CTA */}
      <div
        className={`flex flex-col items-start transition-[opacity,transform] duration-700 ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-3.5 py-1.5 text-xs font-semibold text-brand">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Para refugios, adoptantes y veterinarias</span>
        </div>

        <h1
          className="text-[2.75rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.2rem] text-gray-900 dark:text-white mb-6"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          Encuentra la familia ideal para cada{' '}
          <span className="text-brand">animal</span>.
        </h1>

        <p className="max-w-lg text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
          Un sistema centralizado y profesional para la gestión de adopciones. Simplifica tus procesos, mejora el seguimiento y conecta más deprisa.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-10">
          <Button
            variant="solid"
            onClick={onRegister}
            className="gap-2 px-6 py-2.5 text-base"
          >
            Empezar ahora
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">Gratis para refugios</span>
        </div>

        {/* Inline stats */}
        <div className="flex flex-wrap gap-6 text-sm">
          {[
            { value: '+1.200', label: 'animales' },
            { value: '150+', label: 'refugios' },
            { value: '98%', label: 'éxito' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="font-black text-gray-900 dark:text-white text-lg leading-none">{stat.value}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Preview card */}
      <div
        className={`relative transition-[opacity,transform] delay-200 duration-700 ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Orb decorativo detrás */}
        <div
          className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-brand/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl shadow-gray-900/8 dark:shadow-gray-900/40">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-gray-700 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Mascota destacada
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  Kira · Golden Retriever
                </p>
              </div>
              <span className="rounded-full border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Disponible
              </span>
            </div>

            {/* Image area */}
            <div className="relative flex flex-col items-center justify-center bg-stone-50/50 dark:bg-gray-700/30 px-6 pb-6 pt-8">
              <img
                src="/dog-hero.png"
                alt="Kira, Golden Retriever disponible para adopción"
                width={192}
                height={192}
                className="h-44 w-44 object-contain"
                draggable={false}
                fetchPriority="high"
              />

              {/* Info pills */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                  Refugio Costa Animal
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <PawPrint className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                  Carácter tranquilo
                </span>
              </div>

              <Button variant="solid" className="mt-5 w-full py-2.5" onClick={() => {}}>
                Ver ficha de adopción
              </Button>
            </div>

            {/* Footer stat */}
            <div className="flex items-center justify-between border-t border-stone-100 dark:border-gray-700 bg-stone-50/60 dark:bg-gray-800/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-brand" aria-hidden="true" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">48</span> animales disponibles
                </span>
              </div>
              <span className="text-xs font-semibold text-brand">Ver todos →</span>
            </div>
          </div>

          {/* Floating notification */}
          <div className="absolute -right-3 top-8 hidden rounded-xl border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 shadow-lg xl:block animate-fade-up">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Heart className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">¡Solicitud aprobada!</p>
                <p className="text-[11px] text-gray-500">Kira · Refugio Costa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
