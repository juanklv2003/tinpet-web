import { useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { LandingFeatures } from './components/LandingFeatures';
import { LandingFooter } from './components/LandingFooter';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { LandingStats } from './components/LandingStats';
import { LandingPetsSlider } from './components/LandingPetsSlider';
import { LandingAppMockup } from './components/LandingAppMockup';
import { LandingStories } from './components/LandingStories';

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
    <div className="bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 selection:bg-brand selection:text-white transition-colors duration-500 min-h-screen relative font-sans">
      
      {/* Background Animated Blurred Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Pink Blob 1 */}
        <div className="absolute top-[-5%] left-[-5%] w-[350px] h-[350px] bg-brand/10 dark:bg-brand/5 rounded-full filter blur-[80px] animate-blob"></div>
        
        {/* Cream Blob 1 */}
        <div className="absolute top-[30%] right-[-5%] w-[300px] h-[300px] bg-brand-cream/80 dark:bg-orange-950/10 rounded-full filter blur-[80px] animate-blob animation-delay-2000"></div>

        {/* Pink Blob 2 (Bottom right) */}
        <div className="absolute bottom-[-10%] right-[15%] w-[400px] h-[400px] bg-brand/10 dark:bg-brand/5 rounded-full filter blur-[90px] animate-blob [animation-delay:4s]"></div>

        {/* Yellow Blob 2 (Center left) */}
        <div className="absolute top-[50%] left-[-10%] w-[250px] h-[250px] bg-yellow-300/20 dark:bg-yellow-600/10 rounded-full filter blur-[70px] animate-blob [animation-delay:6s]"></div>
        
        {/* Cream Blob 3 (Center top) */}
        <div className="absolute top-[10%] left-[40%] w-[200px] h-[200px] bg-brand-cream/70 dark:bg-orange-850/10 rounded-full filter blur-[60px] animate-blob [animation-delay:3s]"></div>
      </div>

      <LandingHeader
        onRegister={() => setAuthMode('login')}
        scrolled={scrolled}
      />

      <main className="relative z-10 flex flex-col space-y-12 pb-20 overflow-hidden">
        {/* HERO SECTION */}
        <section id="hero" className="scroll-mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-16 pb-16 md:py-24">
          <LandingHero
            entered={entered}
            onRegister={() => setAuthMode('login')}
          />
        </section>

        {/* PETS INFINITE SCROLL CAROUSEL */}
        <LandingPetsSlider />

        {/* APP MATCH TINDER MOCKUP */}
        <LandingAppMockup />

        {/* FEATURES SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full py-12">
          <LandingFeatures />
        </section>

        {/* STATS SECTION */}
        <section className="w-full py-16">
          <LandingStats />
        </section>

        {/* STORIES SECTION */}
        <LandingStories />
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
