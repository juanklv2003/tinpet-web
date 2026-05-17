import { PawPrint, Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react';

export function LandingFooter() {
  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      const startPosition = window.pageYOffset;
      const distance = offsetPosition - startPosition;
      const duration = 800; // ms
      let start: number | null = null;

      const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
      };

      const animation = (currentTime: number) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const nextScroll = easeInOutQuad(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, nextScroll);
        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        } else {
          window.scrollTo(0, offsetPosition);
        }
      };

      requestAnimationFrame(animation);
    }
  };

  return (
    <footer className="pt-16 pb-12 relative overflow-hidden bg-slate-50 dark:bg-slate-900 border-t border-stone-200/60 dark:border-slate-800 transition-colors duration-300 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-stone-200 dark:border-slate-800">
          {/* Columna de Marca y Redes */}
          <div className="md:col-span-2 text-left">
            <a href="#" className="flex items-center space-x-2 mb-6">
              <span className="w-10 h-10 flex items-center justify-center text-brand text-2xl">
                <PawPrint className="h-6 w-6 fill-current" />
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Tinpet
              </span>
            </a>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm leading-relaxed">
              Conectando corazones con patitas mediante tecnología. Rescatamos, sanamos y reubicamos animales en toda la región.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-brand dark:hover:text-brand hover:border-brand dark:hover:border-brand transition-colors duration-200 flex items-center justify-center"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-brand dark:hover:text-brand hover:border-brand dark:hover:border-brand transition-colors duration-200 flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-brand dark:hover:text-brand hover:border-brand dark:hover:border-brand transition-colors duration-200 flex items-center justify-center"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Columna Explora */}
          <div className="text-left">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Explora</h4>
            <ul className="space-y-4 text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => handleScrollToSection(e, 'hero')}
                  className="hover:text-brand transition-colors duration-200"
                >
                  Inicio
                </a>
              </li>
              <li>
                <a
                  href="#buscar"
                  onClick={(e) => handleScrollToSection(e, 'buscar')}
                  className="hover:text-brand transition-colors duration-200"
                >
                  Mascotas
                </a>
              </li>
              <li>
                <a
                  href="#app"
                  onClick={(e) => handleScrollToSection(e, 'app')}
                  className="hover:text-brand transition-colors duration-200"
                >
                  App Móvil
                </a>
              </li>
              <li>
                <a
                  href="#historias"
                  onClick={(e) => handleScrollToSection(e, 'historias')}
                  className="hover:text-brand transition-colors duration-200"
                >
                  Historias
                </a>
              </li>
            </ul>
          </div>

          {/* Columna Contacto Directo */}
          <div className="text-left">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Contacto Directo</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex items-center">
              <MapPin className="text-brand w-5 h-5 mr-2 shrink-0" />
              <span>Calle de los Peluditos, 123.</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex items-center">
              <Phone className="text-brand w-5 h-5 mr-2 shrink-0" />
              <span>(+34) 912 345 678</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed flex items-center">
              <Mail className="text-brand w-5 h-5 mr-2 shrink-0" />
              <a href="mailto:hola@tinpet.org" className="hover:text-brand transition-colors">
                hola@tinpet.org
              </a>
            </p>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500 dark:text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Tinpet. Encontrando hogares felices.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-brand transition-colors duration-200">
              Privacidad
            </a>
            <a href="#" className="hover:text-brand transition-colors duration-200">
              Términos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
