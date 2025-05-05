import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GitCompare, Database, BarChart3, Microscope, Dna, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BioinformaticsPipeline from '@/components/BioinformaticsPipeline';
import { InstallationCommands } from '@/components/InstallationCommands';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ApiStatusBadge, DevStatusBadge } from "@/components/ApiStatusBadge";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/magicui/terminal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Define the route for the landing page
export const Route = createFileRoute('/')({
  component: LandingPage,
});

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="h-full backdrop-blur-sm">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

// Terminal Demo Component for Drawer
function DrawerTerminalDemo() {
  return (
    <Terminal className="w-full h-[500px] overflow-hidden">
      <TypingAnimation>~/Documents/GitHub/crossroad main*</TypingAnimation>
      <TypingAnimation delay={800}>crossroad_dev ❯ crossroad</TypingAnimation>

      <AnimatedSpan delay={1500} className="text-green-500">
        <span>✔ Preflight checks.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={2000} className="text-green-500">
        <span>✔ Verifying dependencies.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={2500} className="text-green-500">
        <span>✔ Loading genome analysis toolkit.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={3000} className="text-blue-500">
        <span>ℹ Available installation methods:</span>
        <span className="pl-2">- conda/mamba</span>
        <span className="pl-2">- pip/PyPI</span>
      </AnimatedSpan>

      <TypingAnimation delay={3500}>mamba install -c jitendralab -c bioconda -c conda-forge crossroad -y</TypingAnimation>

      <AnimatedSpan delay={4500} className="text-green-500">
        <span>✔ Downloading packages...</span>
      </AnimatedSpan>

      <AnimatedSpan delay={5000} className="text-green-500">
        <span>✔ Resolving dependencies...</span>
      </AnimatedSpan>

      <AnimatedSpan delay={5500} className="text-green-500">
        <span>✔ Installing croSSRoad CLI...</span>
      </AnimatedSpan>

      <AnimatedSpan delay={6000} className="text-blue-500">
        <span>ℹ Installation complete!</span>
      </AnimatedSpan>

      <TypingAnimation delay={6500} className="text-muted-foreground">
        Run 'crossroad --help' to see available commands.
      </TypingAnimation>
    </Terminal>
  );
}

// Installation Instructions Component
function InstallationInstructionsDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <Terminal className="h-5 w-5">
            <span className="sr-only">Terminal</span>
          </Terminal>
          View Installation Guide
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-6xl">
          <DrawerHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <DrawerTitle>Install croSSRoad CLI</DrawerTitle>
          </DrawerHeader>
          
          <ScrollArea className="h-[calc(100vh-15vh-8rem)] px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-16">
              {/* Left side: Installation Commands */}
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium mb-4">For large-scale genomic analyses, use our command-line toolkit:</h3>
                  <InstallationCommands />
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">Anaconda:</h4>
                      <a 
                        href="https://anaconda.org/jitendralab/crossroad" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        anaconda.org/jitendralab/crossroad
                      </a>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">PyPI:</h4>
                      <a 
                        href="https://pypi.org/project/crossroad-cli/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        pypi.org/project/crossroad-cli
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: Terminal Demo */}
              <div className="h-[500px] rounded-lg border bg-card">
                <DrawerTerminalDemo />
              </div>
            </div>
          </ScrollArea>

          {/* Footer with close button - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/80 backdrop-blur-xl">
            <div className="flex justify-end max-w-6xl mx-auto w-full">
              <Button variant="outline" className="w-24">Close</Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Main Landing Page Component
function LandingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(var(--primary-rgb),0.08),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(var(--primary-rgb),0.05),transparent_50%)]" />
      </div>

      {/* Hero Section */}
      <section className="container relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-12 sm:py-20 md:py-24 lg:py-32 lg:pb-36">
        {/* System Status & API Version */}
        <div className="mb-8 flex flex-wrap gap-2 items-center">
          <ApiStatusBadge />
          <DevStatusBadge />
        </div>
        
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 sm:space-y-6"
          >
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Analyze SSR patterns across <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">multiple genomes</span>
            </motion.h1>
            
            <motion.p 
              className="text-base sm:text-lg text-muted-foreground max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              A comprehensive tool for analyzing Simple Sequence Repeats (SSRs), identifying mutational hotspots, and exploring evolutionary patterns in genomic data.
            </motion.p>
            
            <motion.div
              className="flex flex-wrap gap-2 pt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/20 dark:hover:bg-primary/30">#SSRAnalysis</Badge>
              <Badge variant="secondary" className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:bg-blue-500/20 dark:hover:bg-blue-500/30">#Genomics</Badge>
              <Badge variant="secondary" className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 dark:bg-purple-500/20 dark:hover:bg-purple-500/30">#BioinformaticsTool</Badge>
              <Badge variant="secondary" className="bg-green-500/10 hover:bg-green-500/20 text-green-500 dark:bg-green-500/20 dark:hover:bg-green-500/30">#MutationalHotspots</Badge>
              <Badge variant="secondary" className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:bg-amber-500/20 dark:hover:bg-amber-500/30">#MicrosatelliteMarkers</Badge>
              <Badge variant="secondary" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:bg-rose-500/20 dark:hover:bg-rose-500/30">#OpenSource</Badge>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Link to="/analysis" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto font-semibold"
                >
                  Start Analysis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto font-semibold"
                >
                  <BookOpen className="mr-2 h-5 w-5" /> Read Documentation
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:block relative"
          >
            <div className="w-full h-[400px] rounded-lg bg-muted/30 border backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <img src="/logo512.png" alt="croSSRoad Logo" className="h-32 w-32 object-contain" />
                <p className="text-xl font-medium text-foreground/70 mt-4">SSR Analysis Pipeline</p>
              </div>
              
              {/* DNA decorative elements */}
              <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-primary/20" />
              <div className="absolute top-[30%] right-[25%] w-3 h-3 rounded-full bg-primary/30" />
              <div className="absolute bottom-[25%] left-[35%] w-4 h-4 rounded-full bg-primary/20" />
              <div className="absolute bottom-[15%] right-[20%] w-2 h-2 rounded-full bg-primary/30" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-12 sm:py-20 md:py-24 backdrop-blur-[2px]">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 sm:mb-12 text-center">
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Key Features
            </motion.h2>
            <motion.p 
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              From identification to visualization, croSSRoad provides essential tools for SSR analysis.
            </motion.p>
          </div>

          <motion.div 
            className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5, staggerChildren: 0.1 }}
          >
            <FeatureCard
              icon={GitCompare}
              title="Comparative Genomics"
              description="Compare SSR variations across multiple genomes, species, and lineages with both reference-based and reference-free approaches."
            />
            <FeatureCard
              icon={Database}
              title="Hotspot Identification"
              description="Locate mutational hotspots by analyzing SSR variations within genes, tracing evolutionary patterns, and identifying significant changes."
            />
            <FeatureCard
              icon={BarChart3}
              title="Interactive Visualizations"
              description="Explore SSR patterns through heatmaps, dot plots, sankey diagrams, and other interactive visualizations for deeper insights."
            />
            <FeatureCard
              icon={Microscope}
              title="Motif Distribution Analysis"
              description="Analyze the distribution and frequency of SSR motifs across genomes, with support for mono- to hexa-nucleotide repeats."
            />
            <FeatureCard
              icon={Dna}
              title="Flanking Region Analysis"
              description="Study conserved regions around SSRs to understand their context and develop potential PCR primers for genetic mapping."
            />
            <FeatureCard
              icon={Github}
              title="Open-Source Development"
              description="Built on open technologies and continuously improved with contributions from the genomics community."
            />
          </motion.div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="border-t py-12 sm:py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4 sm:space-y-6"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Ready to get started?</h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                croSSRoad makes it easy to analyze SSR patterns across multiple genomes. Choose the option that works best for you:
              </p>
              
              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3">
                <Link to="/analysis" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto font-semibold">
                    Go to Analysis <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <InstallationInstructionsDrawer />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative overflow-hidden rounded-xl border bg-background p-2"
            >
              <div className="rounded-lg bg-muted p-2 sm:p-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500"></div>
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">croSSRoad analysis</div>
                </div>
                
                <div className="mt-4 font-mono text-xs sm:text-sm">
                  <div className="flex gap-2 text-muted-foreground">
                    <span className="select-none">$</span>
                    <span>croSSRoad <span className="text-primary">--input-dir</span> data/</span>
                  </div>
                  <div className="text-muted-foreground/80 pl-5">
                    <p>Running Mode: Full Analysis (FASTA + Categories + Gene BED)</p>
                    <p className="mt-1">Stage 1: Genome Quality Assessment & SSR Detection</p>
                    <p>Stage 2: Gene-Level Analysis</p>
                    <p>Stage 3: Multi-Modal Data Visualization</p>
                    <p>Stage 4: Results Aggregation & Dissemination</p>
                    <p className="mt-1 text-primary">Analysis completed successfully</p>
                    <p className="text-primary">Results available in: <span className="text-muted-foreground">jobOut/job_1723456789/output</span></p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Development Timeline Section - MOVED here from above Features */}
      <section className="border-t py-12 sm:py-20 md:py-24 bg-gradient-to-b from-white/50 to-blue-50/50 dark:from-gray-950/50 dark:to-blue-950/20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <BioinformaticsPipeline />
        </div>
      </section>

      {/* Citation Section */}
      <section className="border-t bg-muted/30 py-10 sm:py-12 md:py-16 lg:py-20 backdrop-blur-[2px]">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl space-y-3 sm:space-y-4"
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Citation</h2>
            <div className="rounded-lg border bg-card p-4 text-sm text-card-foreground shadow-sm">
              <p className="font-mono break-words">
                TBA (2025). croSSRoad: A tool to cross-compare SSRs across species and families. CSIR-IGIB.
              </p>
            </div>
            <p className="text-muted-foreground">
              If you use croSSRoad in your research, please cite our paper.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}