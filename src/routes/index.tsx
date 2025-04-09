import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { ArrowRight, Github, ExternalLink } from "lucide-react"
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Badge } from "@/components/ui/badge"

export const Route = createFileRoute('/')({
  component: HomePage
})

function HomePage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:60px_60px] dark:bg-grid-slate-400/[0.05]" />
      <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      {/* Content */}
      <section className="relative w-full py-12 md:py-24 lg:py-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="container mx-auto px-4 md:px-6 max-w-[1200px]"
        >
          <motion.div
            variants={item} 
            className="flex flex-col items-center space-y-6 text-center"
          >
            <Badge variant="outline" className="mb-2">
              🚀 Built with modern tech stack
            </Badge>
            <h1 className="font-bold tracking-tighter text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Your Modern Dashboard
              <span className="block bg-gradient-to-r from-primary via-primary/75 to-primary/50 bg-clip-text text-transparent">
                Starter Template
              </span>
            </h1>
            <motion.p 
              variants={item}
              className="mx-auto max-w-[600px] text-muted-foreground text-sm md:text-base lg:text-lg"
            >
              Built with Tanstack Router, Shadcn UI, and modern best practices. 
              Perfect for your next project.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 h-11">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a 
                href="https://github.com/pranjalpruthi" 
                target="_blank" 
                rel="noreferrer noopener"
              >
                <Button variant="outline" size="lg" className="gap-2 h-11">
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
              </a>
            </motion.div>

            <motion.div 
              variants={item}
              className="flex flex-wrap justify-center gap-2 pt-4"
            >
              {['Tanstack Router', 'Shadcn UI', 'Tailwind CSS', 'TypeScript'].map((tech) => (
                <Badge 
                  key={tech} 
                  variant="secondary"
                  className="px-3 py-1 text-xs"
                >
                  {tech}
                </Badge>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
