import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "sigmafam.theme";

const ThemeContext = createContext({
  dark: false,
  setDark: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }) {
  const [dark, setDarkState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "dark") return true;
      if (stored === "light") return false;
      // Fallback: preferencia del sistema
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch {
      return false;
    }
  });

  // Aplicar clase al <html> y persistir
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  const setDark = useCallback((val) => {
    setDarkState(typeof val === "function" ? val : Boolean(val));
  }, []);
  const toggle = useCallback(() => setDarkState((v) => !v), []);

  return (
    <ThemeContext.Provider value={{ dark, setDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;