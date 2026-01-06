'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state
    const savedTheme = localStorage.getItem('gym-theme');
    const isDarkInitial = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkInitial);
    if (isDarkInitial) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    const themeStr = newDark ? 'dark' : 'light';
    localStorage.setItem('gym-theme', themeStr);
    
    if (newDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full bg-card-border p-1 transition-colors flex items-center shadow-inner"
      aria-label="Toggle Theme"
    >
      <div 
        className={`w-4 h-4 rounded-full bg-accent transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
      >
        {isDark ? (
           <div className="w-1.5 h-1.5 bg-accent-foreground rounded-full"></div>
        ) : (
           <div className="w-1.5 h-1.5 bg-accent-foreground rounded-full"></div>
        )}
      </div>
    </button>
  );
}