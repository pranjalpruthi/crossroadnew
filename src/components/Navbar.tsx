import { motion } from "framer-motion"
import { ModeToggle } from '@/components/mode-toggle'
import { ChevronRight, HomeIcon, Info, BookOpen, FileText, Copy, Github, BarChart2, MoreHorizontal, ExternalLink } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AboutDrawer } from "@/components/about-drawer"
import { GuideDrawer } from "@/components/GuideDrawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// --- Constants ---
const CITATION = `Pruthi, P., Narayan, J., Agarwal, P., Shukla, N., & Bhatia, A. (2024). CHITRA: Chromosome Interactive Tool for Rearrangement Analysis. CSIR-IGIB.`

// --- Helper Components ---

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const paths = pathname.split('/').filter(Boolean)
  
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <Link to="/" className="hover:text-gray-900 dark:hover:text-gray-50">
        <HomeIcon className="h-4 w-4" />
      </Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`
        const isLast = index === paths.length - 1
        
        const displayPath = decodeURIComponent(path);

        return (
          <div key={displayPath} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link
              to={href}
              className={clsx(
                "capitalize hover:text-gray-900 dark:hover:text-gray-50",
                { "text-gray-900 dark:text-gray-50 font-medium": isLast }
              )}
              // activeProps={{ className: "text-gray-900 dark:text-gray-50 font-medium" }} 
            >
              {displayPath}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function MoreOptionsDropdown() {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CITATION)
      toast.success("Citation copied to clipboard", {
        description: "You can now paste it in your document",
        duration: 2000,
      })
    } catch (err) {
      toast.error("Failed to copy citation", {
        description: "Please try again or copy manually",
        duration: 2000,
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Resources</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link to="/about">
          <DropdownMenuItem className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>Documentation</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>Cite this project</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a 
            href="https://github.com/BioinformaticsOnLine/croSSRoad" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Github className="mr-2 h-4 w-4" />
            <span>GitHub</span>
            <ExternalLink className="ml-auto h-3 w-3" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavActions() {
  return (
    <>
      <div className="hidden sm:flex items-center gap-1">
        <AboutDrawer>
          <Button variant="ghost" size="sm" className="h-8 w-auto hover:bg-background/80 text-sm p-2">
            <Info className="h-4 w-4" />
            <span className="ml-2">About</span>
          </Button>
        </AboutDrawer>
        <GuideDrawer>
          <Button variant="ghost" className="h-8 w-auto hover:bg-background/80 text-sm p-2">
            <BookOpen className="h-4 w-4" />
            <span className="ml-2">Guide</span>
          </Button>
        </GuideDrawer>
        <MoreOptionsDropdown />
      </div>

      <div className="flex sm:hidden items-center gap-0.5">
        <AboutDrawer>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 p-0 hover:bg-background/80"
            aria-label="About"
          >
            <Info className="h-4 w-4" />
          </Button>
        </AboutDrawer>
        
        <GuideDrawer>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 p-0 hover:bg-background/80"
            aria-label="Guide"
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        </GuideDrawer>
        
        <MoreOptionsDropdown />
      </div>
    </>
  )
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHomePage = pathname === '/'
  const isAnalysisPage = pathname === '/analysis/'

  const config = { auth: { enabled: false } };
  const UserProfile = () => <div className="h-8 w-8 rounded-full bg-muted" />;
  const ShinyRotatingBorderButton = ({ children, className }: { children: React.ReactNode, className?: string }) => (
      <Button variant="outline" className={clsx("!p-1 sm:!p-1.5 !px-2 sm:!px-3", className)}>{children}</Button>
  );
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      setIsScrolled(scrollTop > 10) 
    }

    handleScroll() 

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navHeight = isHomePage && !isScrolled ? 'h-[70px] sm:h-[80px]' : 'h-[50px] sm:h-[60px]';
  const headerPadding = isHomePage && !isScrolled ? 'px-3 sm:px-8' : 'px-1 sm:px-4';
  const headerMaxWidth = isHomePage && isScrolled ? 'max-w-3xl' : 'max-w-none';
  const headerRounded = isHomePage ? 'rounded-full' : '';
  const headerBg = isScrolled 
      ? "bg-background/60 backdrop-blur-[16px] brightness-[1.1] border border-white/[0.1] dark:border-white/[0.05]"
      : "bg-background/50 backdrop-blur-[16px]";
  const headerBorder = !isHomePage && isScrolled ? 'border-b border-white/[0.1] dark:border-white/[0.05]' : '';
  const contentHeight = isHomePage && !isScrolled ? 'h-16 sm:h-20' : 'h-12 sm:h-14 lg:h-[55px]';
  const contentPadding = isHomePage && !isScrolled ? 'px-3 sm:px-8' : 'px-1 sm:px-4 md:px-6 lg:px-8';

  return (
    <motion.div 
      className={clsx("fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out", navHeight)}
      layout
    >
      <motion.header 
        layout
        className={clsx(
          "w-full h-full relative transition-all duration-300 ease-in-out",
          headerBg,
          headerBorder,
          { 
            [`${headerMaxWidth} mx-auto ${headerPadding}`]: isHomePage && isScrolled,
            [`w-full ${headerPadding}`]: !isHomePage || !isScrolled,
            [headerRounded]: isHomePage
          }
        )}
      >
        {isScrolled && (
          <motion.div 
            layout
            className={clsx(
              "absolute inset-x-0 -bottom-[1px] h-[1px]",
              "bg-gradient-to-r from-transparent via-white/[0.1] dark:via-white/[0.05] to-transparent",
              isHomePage && "rounded-full"
            )} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}

        <motion.div 
          layout
          className={clsx(
            "flex items-center justify-between w-full mx-auto transition-all duration-300 ease-in-out",
            contentHeight,
            contentPadding,
             { 'max-w-7xl': isHomePage && !isScrolled },
             { 'max-w-3xl': isHomePage && isScrolled}
          )}
        >
          <motion.div 
            layout="position"
            className="flex items-center gap-2 sm:gap-3"
          >
            <Link to="/" aria-label="Go to homepage">
               <ShinyRotatingBorderButton className={clsx(
                "!p-1 sm:!p-1.5 !px-2 sm:!px-3",
                isHomePage && !isScrolled ? "!border-0 !bg-transparent" : ""
              )}>
                <span className="text-sm sm:text-base font-bold tracking-tight">
                  cro<span className="text-primary">SSR</span>oad
                </span> 
              </ShinyRotatingBorderButton>
            </Link>
            <NavActions />
          </motion.div>

          <motion.div 
            layout="position"
            className="flex items-center gap-2 sm:gap-3"
          >
            {!isAnalysisPage && (
              <Link to="/analysis">
                <Button size="sm" variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 hidden sm:flex">
                  <BarChart2 className="h-4 w-4" />
                  <span>Start Analysis</span>
                </Button>
                <Button 
                  variant="default" 
                  size="icon"
                  className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 sm:hidden"
                  aria-label="Start Analysis"
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <div className={clsx(
              "hidden lg:block",
              isHomePage && "hidden"
            )}>
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {config?.auth?.enabled && (
                <UserProfile />
              )}
              <ModeToggle />
            </div>
          </motion.div>
        </motion.div>
      </motion.header>
    </motion.div>
  )
}