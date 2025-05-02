import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ArrowRight, Database, LineChart, Cpu, Code, Dna, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/about/')({  component: AboutPage,})

function AboutPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="relative min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(var(--primary-rgb),0.08),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(var(--primary-rgb),0.05),transparent_50%)]" />
      </div>

      <div className="container mx-auto py-8 sm:py-12 md:py-16 lg:py-20 space-y-6 sm:space-y-8 md:space-y-12 lg:space-y-16 px-4 sm:px-6"> {/* Adjusted space-y */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Badge className="mb-3 sm:mb-4 px-3 py-1 sm:px-3.5 sm:py-1.5" variant="outline">CROSSROAD v0.2.3</Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">🚀 Crossroad</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze SSR patterns across genomes with scale, speed, and style
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-2"> {/* Adjusted grid gap */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4 sm:space-y-6"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader className="space-y-1 sm:space-y-1.5">
                  <CardTitle className="text-lg sm:text-xl flex items-center">
                    <Database className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    About croSSRoad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base">croSSRoad is a powerful and user-friendly pipeline designed for comprehensive cross-genome comparison among multiple strains at the SSR level. It enables efficient identification of similarities and differences in SSR patterns across datasets.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader className="space-y-1 sm:space-y-1.5">
                  <CardTitle className="text-lg sm:text-xl flex items-center">
                    <LineChart className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Key Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">🧬</span>
                      <span>Multi-genome SSR analysis with mutational hotspot detection & evolutionary insights</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">⚡</span>
                      <span>2 concurrent jobs & ⬆️ 500MB upload limit for efficient batch processing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">📦</span>
                      <span>Apache Arrow for fast, memory-efficient binary data handling</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">🧵</span>
                      <span>Web Workers for multithreaded bulk data processing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">📊</span>
                      <span>ECharts & Vega for rendering 100K–1M+ data points interactively</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/analysis" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Try Analysis <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader className="space-y-1 sm:space-y-1.5">
                  <CardTitle className="text-lg sm:text-xl flex items-center">
                    <Cpu className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Tech Stack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">🧠</span>
                      <span>React Query + memoization for snappy, responsive UI</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">🛠️</span>
                      <span>Built with TanStack Query, Table, Start, Router for modern SSR & routing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">💅</span>
                      <span>ShadCN UI for clean, accessible interface design</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">🚦</span>
                      <span>FastAPI backend with job queuing for scalable async task management</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 flex-shrink-0">⚙️</span>
                      <span>pnpm for lightning-fast builds and dependency resolution</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Back to Home <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Terminal Window */}
            <div className="relative overflow-hidden rounded-xl border bg-background p-2">
              <div className="rounded-lg bg-muted p-2 sm:p-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500"></div>
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">croSSRoad Installation</div>
                  <div className="w-4"></div>
                </div>
                <div className="mt-4 font-mono text-xs sm:text-sm text-foreground">
                  <div className="flex">
                    <span className="text-primary mr-2">$</span>
                    <span className="typing-animation break-all">conda create -n crossroad python=3.11.12</span>
                  </div>
                  <div className="text-muted-foreground mt-1 text-[10px] sm:text-xs">Creating environment...</div>
                  <div className="text-green-500 mt-1 text-[10px] sm:text-xs">✓ Environment created successfully</div>

                  <div className="flex mt-3 sm:mt-4">
                    <span className="text-primary mr-2">$</span>
                    <span className="break-all">conda activate crossroad</span>
                  </div>
                  <div className="text-green-500 mt-1 text-[10px] sm:text-xs">✓ Environment activated</div>

                  <div className="flex mt-3 sm:mt-4">
                    <span className="text-primary mr-2">$</span>
                    <span className="break-all">mamba install -c jitendralab -c bioconda -c conda-forge crossroad -y</span>
                  </div>
                  <div className="text-muted-foreground mt-1 text-[10px] sm:text-xs">Installing packages...</div>
                  <div className="text-muted-foreground mt-1 text-[10px] sm:text-xs">Resolving dependencies...</div>
                  <div className="text-green-500 mt-1 text-[10px] sm:text-xs">✓ Installation complete</div>

                  <div className="flex mt-3 sm:mt-4">
                    <span className="text-primary mr-2">$</span>
                    <span>crossroad --help</span>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    <pre className="text-[8px] sm:text-xs overflow-auto scrollbar-none">
{`usage: crossroad [-h] --fasta FASTA --categories CATEGORIES [--gene-bed GENE_BED]
                [--reference-id REFERENCE_ID] [--output-dir OUTPUT_DIR] [--flanks]
                [--mono MONO] [--di DI] [--tri TRI] [--tetra TETRA] [--penta PENTA]
                [--hexa HEXA] [--min-len MIN_LEN] [--max-len MAX_LEN] [--unfair UNFAIR]
                [--threads THREADS] [--min-repeat-count MIN_REPEAT_COUNT]
                [--min-genome-count MIN_GENOME_COUNT]`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="space-y-1 sm:space-y-1.5">
                  <CardTitle className="text-lg sm:text-xl flex items-center">
                    <Code className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Pipeline Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm sm:text-base list-decimal list-inside">
                    <li>Provide input: multi-FASTA, metadata TSV, and gene BED files</li>
                    <li>Run croSSRoad to generate a <code className="text-xs sm:text-sm">jobOut</code> folder with Main, Intermediate, and Plots subdirectories</li>
                    <li>Review main outputs (e.g., <code className="text-xs sm:text-sm">mergedOut.tsv</code>, <code className="text-xs sm:text-sm">hssr_data.csv</code>) and interactive HTML plots</li>
                    <li>Use generated CSV summaries and plots for downstream analysis</li>
                  </ol>
                </CardContent>
                <CardFooter>
                  <Link to="/" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Back to Home
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

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
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Citation</h2>
            <div className="rounded-lg border bg-card p-3 sm:p-4 text-xs sm:text-sm text-card-foreground shadow-sm">
              <p className="font-mono break-words">
                TBA (2025). croSSRoad: A tool to cross-compare SSRs across species and families. CSIR-IGIB.
              </p>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              If you use croSSRoad in your research, please cite our paper.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:gap-6 md:gap-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-primary/10 flex items-center justify-center">
                <Dna className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
              <span className="text-base sm:text-lg font-semibold">croSSRoad</span>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              <Link to="/" className="text-sm sm:text-base text-muted-foreground hover:text-foreground">Home</Link>
              <Link to="/analysis" className="text-sm sm:text-base text-muted-foreground hover:text-foreground">Analysis</Link>
              <Link to="/about" className="text-sm sm:text-base text-muted-foreground hover:text-foreground">Documentation</Link>
              <Link to="/about" className="text-sm sm:text-base text-muted-foreground hover:text-foreground">About</Link>
              <a
                href="https://github.com/BioinformaticsOnLine/croSSRoad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </div>

            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right">
              2025 CSIR-IGIB. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}