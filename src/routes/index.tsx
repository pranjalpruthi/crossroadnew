import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Dna, BookOpen, GitCompare, Database, BarChart3, Github, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';

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

// Main Landing Page Component
function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(var(--primary-rgb),0.08),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(var(--primary-rgb),0.05),transparent_50%)]" />
      </div>

      {/* Hero Section */}
      <section className="container relative mx-auto max-w-6xl px-6 py-20 md:py-24 lg:py-32 lg:pb-36">
        <Badge className="mb-8 px-3.5 py-1.5" variant="outline">CROSSROAD v0.2.1</Badge>
        
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Analyze SSR patterns across <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">multiple genomes</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-muted-foreground max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              A comprehensive tool for analyzing Simple Sequence Repeats (SSRs), identifying mutational hotspots, and exploring evolutionary patterns in genomic data.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Link to="/analysis">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Analysis <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              </Link>
              <Link to="/docs">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
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
                <Dna className="h-32 w-32 text-primary/40" strokeWidth={0.5} />
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
      <section className="border-t bg-muted/30 py-20 md:py-24 backdrop-blur-[2px]">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <motion.h2 
              className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Key Features
            </motion.h2>
            <motion.p 
              className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              From identification to visualization, CROSSROAD provides essential tools for SSR analysis.
            </motion.p>
          </div>

          <motion.div 
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
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
      <section className="border-t py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to get started?</h2>
              <p className="text-lg text-muted-foreground">
                CROSSROAD makes it easy to upload your genome sequences and perform complex SSR analysis with just a few clicks.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Upload your FASTA file</p>
                    <p className="text-muted-foreground">Add genome sequences in FASTA format</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-bold text-primary">2</span>
         </div>
                  <div>
                    <p className="font-medium">Configure parameters</p>
                    <p className="text-muted-foreground">Set analysis preferences or use defaults</p>
               </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-bold text-primary">3</span>
               </div>
                  <div>
                    <p className="font-medium">Explore results</p>
                    <p className="text-muted-foreground">Visualize and download your analysis</p>
                       </div>
                </li>
              </ul>
              
              <div className="pt-4">
                <Link to="/analysis">
                  <Button size="lg">
                    Go to Analysis <ArrowRight className="ml-2 h-5 w-5" />
             </Button>
                </Link>
              </div>
       </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative overflow-hidden rounded-xl border bg-background p-2"
            >
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex space-x-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
               </div>
                  <div className="text-xs text-muted-foreground">crossroad analysis</div>
               </div>
                
                <div className="mt-4 space-y-3 font-mono text-sm">
                  <div className="flex gap-2 text-muted-foreground">
                    <span className="select-none">$</span>
                    <span>crossroad <span className="text-primary">--input-dir</span> data/</span>
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

      {/* Citation Section */}
      <section className="border-t bg-muted/30 py-14 md:py-18 backdrop-blur-[2px]">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl space-y-4"
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Citation</h2>
            <div className="rounded-lg border bg-card p-4 text-sm text-card-foreground shadow-sm">
              <p className="font-mono">
                TBA (2025). CROSSROAD: A tool to cross-compare SSRs across species and families. CSIR-IGIB.
              </p>
            </div>
            <p className="text-muted-foreground">
              If you use CROSSROAD in your research, please cite our paper.
            </p>
         </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                <Dna className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-semibold">CROSSROAD</span>
            </div>
            
            <div className="flex gap-8">
              <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
              <Link to="/analysis" className="text-muted-foreground hover:text-foreground">Analysis</Link>
              <Link to="/docs" className="text-muted-foreground hover:text-foreground">Documentation</Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2025 CSIR-IGIB. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}