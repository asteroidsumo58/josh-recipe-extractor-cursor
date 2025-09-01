'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { themeDebugger } from '@/lib/theme-debug';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark mode
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    themeDebugger.log('🚀 ThemeProvider mounting...');
    setMounted(true);
    
    try {
      // Check for saved theme preference or default to dark
      const savedTheme = localStorage.getItem('theme') as Theme;
      themeDebugger.log('💾 Saved theme from localStorage:', savedTheme);
      
      // Check what theme is currently applied to the DOM
      const root = document.documentElement;
      const hasLightClass = root.classList.contains('light');
      const hasDarkClass = root.classList.contains('dark');
      const currentDOMTheme = hasLightClass ? 'light' : (hasDarkClass ? 'dark' : null);
      themeDebugger.log('🎨 Current DOM theme:', currentDOMTheme);
      
      // Always default to dark mode if no saved theme
      const themeToUse = (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'dark';
      setThemeState(themeToUse);
      
      // Only apply theme if it's different from current DOM state or no theme is applied
      if (currentDOMTheme !== themeToUse) {
        root.classList.remove('light', 'dark');
        root.classList.add(themeToUse);
        themeDebugger.log(`✅ Applied theme: ${themeToUse}`);
      } else {
        themeDebugger.log(`✅ Theme already applied correctly: ${themeToUse}`);
      }
      
      // Save the theme to localStorage if it wasn't already saved
      if (!savedTheme) {
        localStorage.setItem('theme', themeToUse);
        themeDebugger.log(`💾 Saved default theme to localStorage: ${themeToUse}`);
      }
      
      themeDebugger.inspectDOM();
    } catch (error) {
      themeDebugger.error('Error during theme initialization:', error);
      // Fallback to dark mode
      setThemeState('dark');
      try {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } catch (fallbackError) {
        themeDebugger.error('Error in fallback theme setup:', fallbackError);
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      try {
        themeDebugger.log(`🎨 Applying theme: ${theme}`);
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove('light', 'dark');
        themeDebugger.log('Removed existing theme classes');
        
        // Add new theme class
        root.classList.add(theme);
        themeDebugger.log(`Added theme class: ${theme}`);
        
        // Update localStorage
        localStorage.setItem('theme', theme);
        themeDebugger.log(`Updated localStorage with theme: ${theme}`);
        
        // Inspect DOM after changes
        themeDebugger.inspectDOM();
        themeDebugger.inspectLocalStorage();
        
      } catch (error) {
        themeDebugger.error('Error applying theme:', error);
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      themeDebugger.log(`🔄 Toggling theme from ${prev} to ${newTheme}`);
      themeDebugger.log(`Current theme state before change: ${prev}`);
      themeDebugger.log(`New theme state will be: ${newTheme}`);
      return newTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
