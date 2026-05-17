import { PawPrint, Heart, ArrowRight } from 'lucide-react';

interface LandingHeroProps {
  entered: boolean;
  onRegister: () => void;
}

export function LandingHero({ entered }: LandingHeroProps) {
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 w-full transition-[opacity,transform] duration-700
        ${entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      {/* LEFT: Title, Description, and CTAs */}
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6 transition-colors duration-300">
          Encuentra hoy a tu nuevo <br className="hidden lg:inline" />
          <span className="bg-gradient-to-r from-brand to-pink-500 bg-clip-text text-transparent dark:from-brand dark:to-pink-400">
            compañero ideal
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed transition-colors duration-300">
          Adoptar no solo cambia la vida de un peludito, llena la tuya de un amor incondicional, risas y momentos inolvidables en Tinpet.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
          <button
            type="button"
            onClick={() => handleScrollToSection('buscar')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-sm shadow-brand/20 transition-[background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand flex items-center justify-center gap-2"
          >
            <span>Conoce a los peluditos</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScrollToSection('historias')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white dark:bg-dark-card/60 border-2 border-stone-200/60 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-all duration-150 text-center shadow-sm"
          >
            Ver testimonios
          </button>
        </div>
      </div>

      {/* RIGHT: Tilted Dog Image Container with Animated Badges */}
      <div className="flex-1 relative w-full max-w-lg md:max-w-none flex justify-center items-center">
        {/* Decoraciones Integradas */}
        <div className="absolute bottom-6 left-6 w-14 h-14 bg-white dark:bg-dark-card shadow-xl rounded-2xl flex items-center justify-center text-brand text-2xl rotate-12 animate-bounce z-20">
          <PawPrint className="h-7 w-7 fill-current" />
        </div>
        <div className="absolute top-10 right-10 w-12 h-12 bg-brand shadow-xl rounded-full flex items-center justify-center text-white text-lg -rotate-12 animate-pulse z-20">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        
        {/* Tilted Picture frame */}
        <div className="relative z-10 w-[280px] h-[360px] sm:w-[360px] sm:h-[460px] rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-black/40 rotate-3 hover:rotate-0 transition-transform duration-500 border-8 border-white dark:border-dark-card">
          <img
            src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600"
            alt="Perro feliz disponible para adopción"
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
