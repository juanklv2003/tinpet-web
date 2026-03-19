import { useState, useEffect } from 'react';

export function useTheme() {
  const getInitialDarkMode = () => {
    const saved = localStorage.getItem('tinpet-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  // Aplicar clase dark al HTML al iniciar y cuando cambie el estado
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('tinpet-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    console.log('Toggle clicked, current:', isDarkMode);
    setIsDarkMode(prev => !prev);
  };

  return { isDarkMode, toggleDarkMode };
}
