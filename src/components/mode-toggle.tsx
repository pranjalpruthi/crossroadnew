import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface ModeToggleProps {
  iconOnly?: boolean
}

export function ModeToggle({ iconOnly = false }: ModeToggleProps) {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'dark') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('system')
    } else {
      setTheme('dark')
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={cycleTheme}
      className="relative w-10 h-10"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {theme === "dark" ? (
            <Moon className="h-5 w-5 text-blue-500" />
          ) : theme === "system" ? (
            <Monitor className="h-5 w-5 text-purple-500" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-500" />
          )}
        </motion.div>
      </AnimatePresence>
      {!iconOnly && <span className="sr-only">Toggle theme</span>}
    </Button>
  )
} 