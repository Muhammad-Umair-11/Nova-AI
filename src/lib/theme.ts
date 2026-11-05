import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
  localStorage.setItem("nova-theme", t);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme((localStorage.getItem("nova-theme") as Theme) || "light");
  }, []);
  const set = (t: Theme) => { setTheme(t); applyTheme(t); };
  return { theme, setTheme: set, toggle: () => set(theme === "dark" ? "light" : "dark") };
}

export const themeInitScript = `try{if(localStorage.getItem('nova-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;
