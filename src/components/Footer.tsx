import { Link } from '@tanstack/react-router'
import { Github, Twitter, Linkedin, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Brand and Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()}</span>
            <Link to="/" className="font-semibold text-foreground hover:text-primary transition-colors">
              Starter
            </Link>
            <span className="flex items-center gap-1">
              Built with <Heart className="h-4 w-4 text-red-500" /> for Devs
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6">
            <Link 
              to="/about" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              to="/dashboard" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Read
            </Link>
            
            {/* Social Links */}
            <div className="flex items-center gap-4 border-l pl-6">
              <a 
                href="https://github.com/pranjalpruthi" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a 
                href="https://x.com/pranjalpruthi" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="https://www.linkedin.com/in/pranjal-pruthi/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 