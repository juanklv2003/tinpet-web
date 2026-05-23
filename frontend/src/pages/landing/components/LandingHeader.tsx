import { useState } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../components/shelter/hooks/useTheme';
import { useI18n } from '../../../i18n/I18nContext';
import { useTranslation } from '../../../i18n/useTranslation';
import tinpetLogo from '../../../assets/tinpetLogo (2).ico';

interface LandingHeaderProps {
  onRegister: () => void;
  scrolled?: boolean;
}

export function LandingHeader({ onRegister, scrolled = false }: LandingHeaderProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { locale, setLocale } = useI18n();
  const t = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
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
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 border-b
        ${scrolled
          ? 'bg-white/90 dark:bg-dark-bg/90 backdrop-blur-md border-stone-200/80 dark:border-slate-800 shadow-sm'
          : 'bg-transparent border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logotipo */}
        <a href="#" className="flex items-center space-x-2 group focus:outline-none">
          <span className="w-16 h-16 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img src={tinpetLogo} alt="Tinpet Logo" className="h-14 w-14 object-contain" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-brand dark:text-brand">
            Tinpet
          </span>
        </a>

        {/* Navegación Escritorio */}
        <nav className="hidden md:flex space-x-8 font-semibold text-slate-600 dark:text-slate-300">
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, 'hero')}
            className="hover:text-brand dark:hover:text-brand transition-colors duration-200"
          >
            {t('landing.nav.home')}
          </a>
          <a
            href="#buscar"
            onClick={(e) => handleNavClick(e, 'buscar')}
            className="hover:text-brand dark:hover:text-brand transition-colors duration-200"
          >
            {t('landing.nav.pets')}
          </a>
          <a
            href="#app"
            onClick={(e) => handleNavClick(e, 'app')}
            className="hover:text-brand dark:hover:text-brand transition-colors duration-200"
          >
            {t('landing.nav.app')}
          </a>
          <a
            href="#historias"
            onClick={(e) => handleNavClick(e, 'historias')}
            className="hover:text-brand dark:hover:text-brand transition-colors duration-200"
          >
            {t('landing.nav.stories')}
          </a>
        </nav>

        {/* CTA y Controles Header */}
        <div className="flex items-center space-x-3">
          {/* Selector de Idioma (Desktop) */}
          <button
            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border border-slate-200/60 dark:border-slate-800 text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
            aria-label={locale === 'es' ? t('landing.header.switchEnglish') : t('landing.header.switchSpanish')}
            title={locale === 'es' ? t('landing.header.switchEnglish') : t('landing.header.switchSpanish')}
          >
            {locale === 'es' ? 'ES' : 'EN'}
          </button>

          {/* Toggle Tema Oscuro/Claro */}
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
            aria-label={t('landing.header.switchTheme')}
            title={isDarkMode ? t('landing.header.lightMode') : t('landing.header.darkMode')}
          >
            {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {/* Botón Principal */}
          <Button
            variant="solid"
            onClick={onRegister}
            className="hidden sm:inline-flex px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-sm shadow-brand/20 transition-[background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t('landing.header.cta')}
          </Button>
          
          {/* Botón Menú Móvil */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand hover:text-white transition-all duration-200 focus:outline-none"
            aria-label={t('landing.header.menu')}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menú Móvil */}
      <div
        className={`md:hidden bg-white dark:bg-dark-bg border-b border-slate-100 dark:border-slate-800 px-6 py-6 space-y-4 shadow-lg absolute w-full left-0 transition-colors duration-300
          ${isMobileMenuOpen ? 'block' : 'hidden'}`}
      >
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, 'hero')}
          className="block text-lg font-semibold text-slate-700 dark:text-slate-300 hover:text-brand text-left"
        >
          {t('landing.nav.home')}
        </a>
        <a
          href="#buscar"
          onClick={(e) => handleNavClick(e, 'buscar')}
          className="block text-lg font-semibold text-slate-700 dark:text-slate-300 hover:text-brand text-left"
        >
          {t('landing.nav.pets')}
        </a>
        <a
          href="#app"
          onClick={(e) => handleNavClick(e, 'app')}
          className="block text-lg font-semibold text-slate-700 dark:text-slate-300 hover:text-brand text-left"
        >
          {t('landing.nav.app')}
        </a>
        <a
          href="#historias"
          onClick={(e) => handleNavClick(e, 'historias')}
          className="block text-lg font-semibold text-slate-700 dark:text-slate-300 hover:text-brand text-left"
        >
          {t('landing.nav.stories')}
        </a>
        {/* Selector de Idioma (Mobile) */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {t('landing.header.language')}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setLocale('es');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border
                ${locale === 'es'
                  ? 'bg-brand/10 border-brand/35 text-brand dark:bg-brand/20 dark:text-brand-light'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <span>🇪🇸</span> Español
            </button>
            <button
              onClick={() => {
                setLocale('en');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border
                ${locale === 'en'
                  ? 'bg-brand/10 border-brand/35 text-brand dark:bg-brand/20 dark:text-brand-light'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <span>🇬🇧</span> English
            </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />
        <Button
          variant="solid"
          onClick={() => {
            onRegister();
            setIsMobileMenuOpen(false);
          }}
          className="w-full px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-sm shadow-brand/20 transition-[background-color] duration-150 flex justify-center"
        >
          {t('landing.header.cta')}
        </Button>
      </div>
    </header>
  );
}
