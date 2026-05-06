import { PawPrint } from 'lucide-react';
import { Button } from '../../../components/ui/Button'

interface LandingHeaderProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingHeader({ onLogin, onRegister }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-[#fdfaf8]/90 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/90">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white transition group-hover:bg-brand-dark">
            <PawPrint className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            tinpet
          </span>
        </a>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" onClick={onLogin} className="rounded-md">
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
