import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function getSystemTheme() {
  if (typeof window === "undefined") return "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("portfolio-theme") || "dark";
  });

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemTheme = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", updateSystemTheme);

    return () => {
      media.removeEventListener("change", updateSystemTheme);
    };
  }, []);

  const activeTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", activeTheme === "dark");

    localStorage.setItem("portfolio-theme", theme);
    document.documentElement.style.colorScheme = activeTheme;
  }, [theme, activeTheme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        activeTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
