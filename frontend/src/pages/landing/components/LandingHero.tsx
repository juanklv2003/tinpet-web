import { ArrowRight, Heart, MapPin, PawPrint } from 'lucide-react';
import { Button } from '../../../components/ui/Button'

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
          entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide text-brand">
          <span className="uppercase">Para Refugios y Adoptantes</span>
        </div>

        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl text-slate-900 dark:text-white mb-6">
          Encuentra la familia ideal para cada <span className="text-brand">animal</span>.
        </h1>

        <p className="max-w-lg text-lg text-slate-600 dark:text-gray-300 leading-relaxed mb-8">
          Un sistema centralizado y profesional para la gestión de adopciones. Simplifica tus procesos, mejora el seguimiento y conecta más deprisa.
        </p>

        <Button variant="solid" onClick={onRegister} className="inline-flex items-center justify-center gap-2 rounded-md px-8 py-3 text-base">
          Empezar ahora
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* RIGHT COLUMN: Cleaner Illustration */}
      <div
        className={`relative transition-all delay-200 duration-700 ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-gray-800">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Kira
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Golden Retriever
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Disponible
              </span>
            </div>

            <div className="py-8 flex justify-center">
              <img
                src="/dog-hero.png"
                alt="Kira, Golden Retriever"
                className="h-48 w-48 object-contain"
                draggable={false}
              />
            </div>

            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-gray-800 dark:text-gray-300">
                <MapPin className="h-3 w-3 text-brand" />
                Refugio Costa
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-gray-800 dark:text-gray-300">
                <PawPrint className="h-3 w-3 text-brand" />
                Tranquila
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
