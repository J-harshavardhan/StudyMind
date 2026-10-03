import { createContext, useContext, useEffect, useState } from 'react';

const C = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(localStorage.getItem('studymind_theme') === 'dark');

  useEffect(() => {
    document.body.dataset.bsTheme = dark ? 'dark' : 'light';
    localStorage.setItem('studymind_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return <C.Provider value={{
    dark,
    toggle: () => setDark((current) => !current),
    setTheme: (theme) => setDark(theme === 'dark')
  }}>{children}</C.Provider>;
}

export const useTheme = () => useContext(C);
