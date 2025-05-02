import { motion, useMotionValue } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Home,
  Moon,
  Sun,
  FileText,
  GripVertical,
  LayoutGrid,
  LayoutPanelTop,
  BookOpen, // Added for Guide
  Info,     // Added for About
  Monitor,  // Added for System theme
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Link } from '@tanstack/react-router';
import { ExampleFilesDrawer } from '@/components/ExampleFilesDrawer';
import { GuideDrawer } from '@/components/GuideDrawer'; // Import GuideDrawer
import { AboutDrawer } from '@/components/about-drawer'; // Import AboutDrawer
import { AnimatePresence } from "framer-motion";

interface AnalysisBottomNavProps {
  onLoadExample: (exampleName: string) => void; // Function to load example data
  onLoadDemo?: () => void; // Optional function to load demo analysis
  // Add other props from original snippet if needed later
}

export function AnalysisBottomNav({ onLoadExample, onLoadDemo }: AnalysisBottomNavProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isVertical, setIsVertical] = useState(false);
  const [forceVertical, setForceVertical] = useState(false);
  const { theme, setTheme } = useTheme();

  // Logic to switch layout based on drag position (optional, can be simplified)
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      if (!forceVertical && x.get() > windowWidth - 150) { // Adjust threshold as needed
        setIsVertical(true);
      } else if (!forceVertical) {
        setIsVertical(false);
      }
    };

    const unsubscribeX = x.onChange((latest) => {
      const windowWidth = window.innerWidth;
      if (!forceVertical) {
        setIsVertical(latest > windowWidth - 150); // Adjust threshold
      }
    });

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      unsubscribeX();
      window.removeEventListener('resize', handleResize);
    };
  }, [x, forceVertical]);

  // Update isVertical when forceVertical changes
  useEffect(() => {
    setIsVertical(forceVertical);
  }, [forceVertical]);

  const toggleLayout = () => {
    setForceVertical(!forceVertical);
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.5 }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05 }}
      style={{ x, y }} // Apply motion values
      className="fixed bottom-4 sm:bottom-8 inset-x-0 mx-auto w-fit z-50 cursor-grab active:cursor-grabbing"
    >
      <div className="relative">
        {/* Background blur gradients */}
        <div className={cn(
          "absolute inset-0 blur-2xl rounded-2xl",
          isVertical
            ? "bg-gradient-to-b from-blue-500/20 to-purple-500/20"
            : "bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20"
        )} />
        <div className={cn(
          "absolute inset-0 blur-xl rounded-2xl opacity-50",
          isVertical
            ? "bg-gradient-to-t from-blue-400/10 to-purple-400/10"
            : "bg-gradient-to-l from-blue-400/10 via-indigo-400/10 to-purple-400/10"
        )} />

        {/* Main container */}
        <div className={cn(
          "relative bg-white/80 dark:bg-black/40 backdrop-blur-md border-[1.5px] border-indigo-200/50 dark:border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300",
          "ring-2 ring-blue-500/30 dark:ring-blue-600/30",
          isVertical ? "px-2 py-3" : "px-2 sm:px-4 py-1.5 sm:py-2" // Dynamic padding
        )}>
          <div className={cn(
            "flex items-center gap-1 sm:gap-2 [&>*]:!text-gray-700 dark:[&>*]:!text-white [&_svg]:!stroke-gray-600 dark:[&_svg]:!stroke-white",
            isVertical ? "flex-col" : "flex-row justify-center" // Dynamic flex direction
          )}>
            {/* Home Button */}
            <Link to="/">
              <Button variant="ghost" size="sm" className={cn("transition-colors group", isVertical ? "h-8 w-8 p-0" : "h-8 px-2 text-xs font-medium", "hover:bg-gray-100 dark:hover:bg-gray-800 [&_svg]:stroke-gray-500")}>
                <Home className="h-3.5 w-3.5" />
                {!isVertical && <span className="hidden sm:inline ml-1.5">Home</span>}
              </Button>
            </Link>

            {/* Example Files Button & Drawer */}
            <ExampleFilesDrawer onLoadExample={onLoadExample} onLoadDemo={onLoadDemo}>
              <Button variant="ghost" size="sm" className={cn("hover:bg-white/10 hover:text-white transition-colors group", isVertical ? "h-8 w-8 p-0" : "h-8 px-2 text-xs")}>
                <FileText className="h-3.5 w-3.5 group-hover:text-blue-400" />
                {!isVertical && <span className="hidden sm:inline ml-1.5">Examples</span>}
              </Button>
            </ExampleFilesDrawer>

            {/* Guide Button & Drawer */}
            <GuideDrawer>
              <Button variant="ghost" size="sm" className={cn("hover:bg-white/10 hover:text-white transition-colors group", isVertical ? "h-8 w-8 p-0" : "h-8 px-2 text-xs")}>
                <BookOpen className="h-3.5 w-3.5 group-hover:text-cyan-400" />
                {!isVertical && <span className="hidden sm:inline ml-1.5">Guide</span>}
              </Button>
            </GuideDrawer>

            {/* About Button & Drawer */}
            <AboutDrawer>
               <Button variant="ghost" size="sm" className={cn("hover:bg-white/10 hover:text-white transition-colors group", isVertical ? "h-8 w-8 p-0" : "h-8 px-2 text-xs")}>
                 <Info className="h-3.5 w-3.5 group-hover:text-lime-400" />
                 {!isVertical && <span className="hidden sm:inline ml-1.5">About</span>}
               </Button>
            </AboutDrawer>

            {/* Settings Button (Placeholder - kept for structure) */}
             {/* <Button variant="ghost" size="sm" onClick={() => console.log("Settings clicked")} className={cn("transition-colors group", isVertical ? "h-8 w-8 p-0" : "h-8 px-2 text-xs font-medium", "hover:bg-gray-100 dark:hover:bg-gray-800 [&_svg]:stroke-gray-500")}>
                <Settings className="h-3.5 w-3.5" />
                {!isVertical && <span className="hidden sm:inline ml-1.5">Settings</span>}
              </Button> */}

            {/* Separator */}
            {!isVertical && <Separator orientation="vertical" className="h-6 mx-1 bg-white/20 hidden sm:block" />}

            {/* Theme Toggle Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setTheme(theme === "system" ? "dark" : theme === "dark" ? "light" : "system")} 
              className={cn(
                "transition-colors group", 
                "h-8 w-8 p-0", 
                "hover:bg-white/10 hover:text-white"
              )} 
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center"
                >
                  {theme === "dark" ? (
                    <Sun className="h-3.5 w-3.5 group-hover:text-amber-400" />
                  ) : theme === "system" ? (
                    <Monitor className="h-3.5 w-3.5 group-hover:text-purple-400" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 group-hover:text-blue-400" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>

            {/* Layout Toggle Button */}
            <Button variant="ghost" size="icon" onClick={toggleLayout} className={cn("hover:bg-accent hover:text-accent-foreground transition-colors", isVertical ? "h-8 w-8" : "h-8 w-8", forceVertical && "bg-accent/50")}>
              {isVertical ? <LayoutGrid className="h-4 w-4" /> : <LayoutPanelTop className="h-4 w-4" />}
            </Button>

            {/* Drag Handle */}
            <div className={cn("flex items-center cursor-grab active:cursor-grabbing", isVertical ? "pt-1" : "pl-1 pr-0.5")}>
              <GripVertical className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}