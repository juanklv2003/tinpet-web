import { useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { LandingFeatures } from './components/LandingFeatures';
import { LandingFooter } from './components/LandingFooter';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { LandingStats } from './components/LandingStats';

export default function LandingPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Reveal animation
    const rafId = window.requestAnimationFrame(() => setEntered(true));
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfaf8] dark:bg-gray-900 text-gray-900 dark:text-gray-100 selection:bg-brand/10 selection:text-brand font-sans">
      <LandingHeader
        onLogin={() => setAuthMode('login')}
        onRegister={() => setAuthMode('register')}
        scrolled={scrolled}
      />

      <main className="pt-28 lg:pt-36 flex flex-col">
        {/* HERO SECTION */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto w-full mb-24 lg:mb-32">
          <LandingHero
            entered={entered}
            onRegister={() => setAuthMode('register')}
          />
        </section>

        {/* FEATURES SECTION */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto w-full mb-24 lg:mb-32">
          <LandingFeatures />
        </section>

        {/* STATS SECTION */}
        <section className="w-full bg-gradient-to-br from-brand/5 via-[#fdfaf8] to-amber-50/50 dark:from-brand/10 dark:via-gray-900 dark:to-gray-900 py-24 border-y border-stone-200/50 dark:border-gray-800">
          <LandingStats />
        </section>
      </main>

      <LandingFooter />

      {authMode && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
        />
      )}
    </div>
  );
}
