import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const ThemeProviderContext = createContext<ThemeProviderState | null>(null)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(
    theme === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : (theme as "dark" | "light")
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        const newTheme = e.matches ? "dark" : "light"
        root.classList.add(newTheme)
        setResolvedTheme(newTheme)
      }

      systemTheme.addEventListener("change", updateSystemTheme)
      updateSystemTheme(systemTheme)

      return () => systemTheme.removeEventListener("change", updateSystemTheme)
    } else {
      root.classList.add(theme)
      setResolvedTheme(theme as "dark" | "light")
    }
  }, [theme])

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (!context) throw new Error("useTheme must be used within a ThemeProvider")
  return context
} 