import { Cat, Dog, Heart, MapPin, PawPrint } from 'lucide-react';
import { Button } from '../../../components/ui/Button'

interface LandingPreviewProps {
  entered: boolean;
}

type PetKind = 'dog' | 'cat' | 'other';

const PETS: Array<{
  id: number;
  name: string;
  breed: string;
  age: string;
  location: string;
  bg: string;
  iconColor: string;
  kind: PetKind;
  tag: string;
  tagClass: string;
}> = [
  {
    id: 1,
    name: 'Sully',
    breed: 'Labrador · 4 años',
    age: '4 años',
    location: 'Protectora Valencia',
    bg: 'bg-sky-50',
    iconColor: 'text-sky-400',
    kind: 'dog',
    tag: 'Adoptado',
    tagClass: 'text-brand bg-brand/10 border-brand/20',
  },
  {
    id: 2,
    name: 'Luna',
    breed: 'Border Collie · 1 año',
    age: '1 año',
    location: 'Refugio Esperanza',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    kind: 'dog',
    tag: 'Disponible',
    tagClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 3,
    name: 'Mochi',
    breed: 'Mestizo · 3 años',
    age: '3 años',
    location: 'Protectora Málaga',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    kind: 'cat',
    tag: 'En proceso',
    tagClass: 'text-amber-700 bg-amber-50 border-amber-200',
  },
];

function PetIcon({ kind, className }: { kind: PetKind; className?: string }) {
  if (kind === 'cat') return <Cat className={className} strokeWidth={1.5} />;
  if (kind === 'dog') return <Dog className={className} strokeWidth={1.5} />;
  return <PawPrint className={className} strokeWidth={1.5} />;
}

function SmallPetCard({ pet }: { pet: typeof PETS[number] }) {
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-brand/30 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Icon avatar */}
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${pet.bg} dark:opacity-90`}>
        <PetIcon kind={pet.kind} className={`h-5 w-5 ${pet.iconColor}`} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{pet.name}</p>
          <span className={`flex-shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${pet.tagClass}`}>
            {pet.tag}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{pet.location}</span>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Guardar ${pet.name}`}
        className="flex-shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-stone-50 hover:text-brand dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-brand"
      >
        <Heart className="h-4 w-4" />
      </button>
    </div>
  );
}

export function LandingPreview({ entered }: LandingPreviewProps) {
  return (
    <div
      className={`relative transition-all delay-200 duration-500 ${
        entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-6 dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">

        {/* ── Featured Pet ─────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Mascota del día
              </p>
              <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                Kira · Golden Retriever
              </p>
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400">
              Disponible
            </span>
          </div>

          {/* Dog illustration without excessive gradient */}
          <div className="relative flex flex-col items-center justify-center bg-stone-50/50 px-6 pb-6 pt-8 dark:bg-slate-800/50">
            <div className="relative">
              <img
                src="/dog-hero.png"
                alt="Kira, Golden Retriever disponible para adopción"
                className="h-40 w-40 object-contain sm:h-48 sm:w-48"
                draggable={false}
              />
            </div>

            {/* Info pills below dog */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                Refugio Costa Animal
              </span>
              <span className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <PawPrint className="h-3.5 w-3.5 text-brand" />
                Carácter tranquilo
              </span>
            </div>

            {/* CTA button */}
            <Button variant="solid" className="mt-6 w-full py-3" onClick={() => {}}>
              Ver ficha de adopción
            </Button>
          </div>
        </div>

        {/* ── Other pets list ───────────────────────── */}
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Más animales · Madrid
        </p>
        <div className="space-y-3">
          {PETS.map((pet) => (
            <SmallPetCard key={pet.id} pet={pet} />
          ))}
        </div>

        {/* Bottom status bar */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">48</span> animales disponibles
            </p>
          </div>
          <p className="text-sm font-medium text-brand hover:underline cursor-pointer">Ver todos →</p>
        </div>
      </div>

      {/* Floating notification — only on desktop */}
      <div className="absolute -right-4 top-6 hidden rounded-xl border border-stone-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-900 xl:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <Heart className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">¡Solicitud aprobada!</p>
            <p className="text-xs text-slate-500">Kira · Refugio Costa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
