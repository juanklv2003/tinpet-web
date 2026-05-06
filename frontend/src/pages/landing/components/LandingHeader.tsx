import { PawPrint } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface LandingHeaderProps {
  onLogin: () => void;
  onRegister: () => void;
  scrolled?: boolean;
}

export function LandingHeader({ onLogin, onRegister, scrolled = false }: LandingHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-10 transition-[background-color,border-color,box-shadow] duration-200
        bg-[#fdfaf8]/90 dark:bg-gray-900/90 backdrop-blur-sm
        ${scrolled
          ? 'border-b border-stone-200/80 dark:border-gray-800/60 shadow-sm'
          : 'border-b border-transparent'
        }`}
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-lg"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white transition-[background-color] duration-150 group-hover:bg-brand-dark">
            <PawPrint className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
            <span className="text-brand">tin</span>pet
          </span>
        </a>

        {/* Nav */}
        <nav className="flex items-center gap-1" aria-label="Navegación principal">
          <Button variant="ghost" onClick={onLogin} className="rounded-lg">
            Iniciar sesión
          </Button>
          <Button variant="solid" onClick={onRegister} className="ml-2">
            Empezar gratis
          </Button>
        </nav>
      </div>
    </header>
  );
}
