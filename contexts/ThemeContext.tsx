import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

type Theme = 'cyberpunk' | 'lightwave' | 'nebula' | 'solaris' | 'oceanic' | 'matrix';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('aetherwave-theme');
      return (storedTheme as Theme) || 'cyberpunk';
    } catch {
      return 'cyberpunk';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const oldTheme = root.getAttribute('data-theme');
    if (oldTheme !== theme) {
        root.setAttribute('data-theme', theme);
    }
    try {
      localStorage.setItem('aetherwave-theme', theme);
    } catch (error) {
      console.error("Could not save theme to localStorage", error);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};