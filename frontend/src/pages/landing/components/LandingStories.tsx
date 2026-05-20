import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Heart, Cat, Dog } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';

const stories = [
  {
    id: 1,
    family: "Familia Gómez Ruiz",
    petName: "Luna",
    petType: "cat",
    time: "Hace 3 meses",
    badge: "Amor incondicional",
    img: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=150",
    text: "Hicimos match en la app al instante. Luna llegó en el momento perfecto. Es súper tranquila y nos llena de paz."
  },
  {
    id: 2,
    family: "Carlos y Ana",
    petName: "Toby",
    petType: "dog",
    time: "Hace 6 meses",
    badge: "Amigos de aventura",
    img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=150",
    text: "Toby desborda energía y nos ha motivado a hacer senderismo. Chatear con el refugio por la app fue facilísimo."
  },
  {
    id: 3,
    family: "Clara y Mateo",
    petName: "Milo",
    petType: "dog",
    time: "Hace 1 año",
    badge: "Felicidad pura",
    img: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=150",
    text: "Milo era un cachorrito tímido. Hoy es el rey de la casa, siempre nos recibe saltando de felicidad. Adopten."
  },
  {
    id: 4,
    family: "Martín y Sofía",
    petName: "Oliver",
    petType: "cat",
    time: "Hace 2 meses",
    badge: "Compañero fiel",
    img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=150",
    text: "Oliver es el gato más mimoso del mundo. Se la pasa ronroneando en mis piernas mientras teletrabajo. La app nos cambió la vida."
  },
  {
    id: 5,
    family: "Familia Díaz Sosa",
    petName: "Copito",
    petType: "cat",
    time: "Hace 9 meses",
    badge: "Miembro de la casa",
    img: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=150",
    text: "Copito es súper juguetón. Los chicos lo adoran y él a ellos. Encontrar un compañero en TinPet fue un sueño hecho realidad."
  },
  {
    id: 6,
    family: "Laura Torres",
    petName: "Mila",
    petType: "dog",
    time: "Hace 5 meses",
    badge: "Protección y cariño",
    img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150",
    text: "Mila es una perra gigante de tamaño, pero gigante de corazón también. Me acompaña a correr todas las mañanas."
  }
];

export function LandingStories() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const t = useTranslation();

  const scroll = (direction: 'left' | 'right') => {
    const container = carouselRef.current;
    if (container) {
      const card = container.querySelector('.snap-start') as HTMLElement;
      if (card) {
        const scrollAmount = card.offsetWidth + 24;
        const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

        // Desactivamos temporalmente scroll-snap para control total de la curva de animación en JS
        container.style.scrollSnapType = 'none';

        const startPosition = container.scrollLeft;
        const distance = targetScroll - startPosition;
        const duration = 750; // ms - Desplazamiento premium hiper-suave
        let start: number | null = null;

        // Easing easeOutQuart (rápido en arranque, desaceleración prolongada y ultra-suave)
        const easeOutQuart = (t: number, b: number, c: number, d: number) => {
          t /= d;
          t--;
          return -c * (t * t * t * t - 1) + b;
        };

        const animate = (currentTime: number) => {
          if (start === null) start = currentTime;
          const timeElapsed = currentTime - start;
          const nextScroll = easeOutQuart(timeElapsed, startPosition, distance, duration);
          container.scrollLeft = nextScroll;

          if (timeElapsed < duration) {
            requestAnimationFrame(animate);
          } else {
            container.scrollLeft = targetScroll;
            // Reactivamos el scroll-snap nativo al terminar
            container.style.scrollSnapType = '';
          }
        };

        requestAnimationFrame(animate);
      }
    }
  };

  return (
    <section id="historias" className="scroll-mt-24 py-16 w-full relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="text-left max-w-2xl">
            <span className="text-brand font-bold uppercase tracking-widest text-sm block mb-2">{t('landing.stories.tag')}</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white transition-colors duration-300">
              {t('landing.stories.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-300">
              {t('landing.stories.description')}
            </p>
          </div>
          <div className="flex space-x-3 mt-6 md:mt-0">
            <button
              onClick={() => scroll('left')}
              className="w-12 h-12 rounded-full bg-white dark:bg-dark-card border border-stone-200 dark:border-slate-700 hover:bg-brand hover:border-brand dark:hover:bg-brand text-gray-700 dark:text-gray-300 hover:text-white shadow-sm flex items-center justify-center active:scale-95 transition-all duration-200"
              aria-label={t('landing.stories.prev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-12 h-12 rounded-full bg-white dark:bg-dark-card border border-stone-200 dark:border-slate-700 hover:bg-brand hover:border-brand dark:hover:bg-brand text-gray-700 dark:text-gray-300 hover:text-white shadow-sm flex items-center justify-center active:scale-95 transition-all duration-200"
              aria-label={t('landing.stories.next')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

      <div className="relative w-full">
        <div
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 px-1"
        >
          {stories.map((story) => (
            <div
              key={story.id}
              className="min-w-[85%] sm:min-w-[45%] lg:min-w-[31%] bg-white dark:bg-dark-card p-6 rounded-[32px] shadow-sm border border-stone-200/60 dark:border-slate-800 snap-start flex flex-col justify-between hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1.5 hover:border-brand/20 dark:hover:border-brand/20 transition-all duration-500 ease-out"
            >
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-cream shrink-0">
                    <img src={story.img} alt={story.family} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900 dark:text-white">{story.family}</h4>
                    <span className="text-xs text-brand font-bold flex items-center gap-1">
                      <span>{t('landing.stories.adopted')} {story.petName}</span>
                      {story.petType === 'cat' ? <Cat className="h-3 w-3" /> : <Dog className="h-3 w-3" />}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed mb-6 text-left">
                  "{story.text}"
                </p>
              </div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 border-t border-stone-100 dark:border-slate-800 pt-4 flex justify-between items-center">
                <span>{story.time}</span>
                <span className="text-brand flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  <span>{story.badge}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
