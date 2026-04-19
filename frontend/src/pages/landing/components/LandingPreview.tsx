import { Cat, Dog, Heart, MapPin, PawPrint } from 'lucide-react';

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
    tagClass: 'text-pink-600 bg-pink-50 border-pink-100',
  },
  {
    id: 2,
    name: 'Luna',
    breed: 'Border Collie · 1 año',
    age: '1 año',
    location: 'Refugio Esperanza',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-400',
    kind: 'dog',
    tag: 'Disponible',
    tagClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    id: 3,
    name: 'Mochi',
    breed: 'Mestizo · 3 años',
    age: '3 años',
    location: 'Protectora Málaga',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-400',
    kind: 'cat',
    tag: 'En proceso',
    tagClass: 'text-amber-600 bg-amber-50 border-amber-100',
  },
];

function PetIcon({ kind, className }: { kind: PetKind; className?: string }) {
  if (kind === 'cat') return <Cat className={className} strokeWidth={1.5} />;
  if (kind === 'dog') return <Dog className={className} strokeWidth={1.5} />;
  return <PawPrint className={className} strokeWidth={1.5} />;
}

function SmallPetCard({ pet }: { pet: typeof PETS[number] }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 transition hover:border-pink-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Icon avatar */}
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${pet.bg} dark:opacity-90`}>
        <PetIcon kind={pet.kind} className={`h-5 w-5 ${pet.iconColor}`} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800 dark:text-white">{pet.name}</p>
          <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pet.tagClass}`}>
            {pet.tag}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{pet.location}</span>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Guardar ${pet.name}`}
        className="flex-shrink-0 rounded-full p-1 text-slate-300 transition hover:text-pink-500 dark:text-slate-600 dark:hover:text-pink-400"
      >
        <Heart className="h-3.5 w-3.5" />
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
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-[#f7f4f1] p-6 dark:border-slate-800 dark:bg-slate-900/60 sm:p-7">

        {/* ── Featured Pet ─────────────────────────── */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-pink-500">
                Mascota del día
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Kira · Golden Retriever · 2 años
              </p>
            </div>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400">
              Disponible
            </span>
          </div>

          {/* Dog illustration with float animation */}
          <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-[#fdfaf8] px-6 pb-4 pt-6 dark:from-slate-800 dark:to-slate-900">
            <div className="dog-float relative">
              <img
                src="/dog-hero.png"
                alt="Kira, Golden Retriever disponible para adopción"
                className="h-40 w-40 object-contain drop-shadow-md sm:h-48 sm:w-48"
                draggable={false}
              />
            </div>
            {/* Sombra elíptica animada */}
            <div className="dog-shadow mt-1 h-3 w-24 rounded-full bg-amber-900/20 blur-sm" />

            {/* Info pills below dog */}
            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <MapPin className="h-3 w-3 text-pink-400" />
                Refugio Costa Animal
              </span>
              <span className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <PawPrint className="h-3 w-3 text-pink-400" />
                Carácter tranquilo
              </span>
            </div>

            {/* CTA button */}
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-pink-500 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600 active:scale-95"
            >
              Ver ficha de adopción
            </button>
          </div>
        </div>

        {/* ── Other pets list ───────────────────────── */}
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Más animales · Madrid
        </p>
        <div className="space-y-2">
          {PETS.map((pet) => (
            <SmallPetCard key={pet.id} pet={pet} />
          ))}
        </div>

        {/* Bottom status bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-stone-100 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">48</span> animales disponibles ahora
            </p>
          </div>
          <p className="text-[11px] font-medium text-pink-500">Ver todos →</p>
        </div>
      </div>

      {/* Floating notification — only on desktop */}
      <div className="absolute -right-4 top-6 hidden animate-[fade-in_0.5s_ease_0.8s_both] rounded-2xl border border-stone-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900 xl:block">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <Heart className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">¡Solicitud aprobada!</p>
            <p className="text-[10px] text-slate-400">Kira · Refugio Costa Animal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
