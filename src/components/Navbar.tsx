import { Link } from '@tanstack/react-router'
import { ModeToggle } from './mode-toggle'
import { BookOpen, Code2, Github, Home, LayoutDashboard, Menu, Package } from 'lucide-react'
import { Button } from './ui/button'
import { motion } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Link to="/" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">
                TanStack
                <span className="text-primary">Start</span>
              </span>
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              v1.0.0
            </Badge>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center space-x-1"
          >
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
            <a 
              href="https://tanstack.com/router/latest/docs/framework/react/overview" 
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Docs</span>
              </Button>
            </a>
            <a 
              href="https://github.com/your-username/tanstack-start" 
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </Button>
            </a>
            <Separator orientation="vertical" className="mx-2 h-6" />
            <ModeToggle />
          </motion.div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span>TanStack Start</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 pt-6">
                  <Link to="/">
                    <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Separator className="my-2" />
                  <a 
                    href="https://tanstack.com/router/latest/docs/framework/react/overview" 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Documentation</span>
                    </Button>
                  </a>
                  <a 
                    href="https://github.com/your-username/tanstack-start" 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
                      <Github className="h-4 w-4" />
                      <span>GitHub</span>
                    </Button>
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
} 