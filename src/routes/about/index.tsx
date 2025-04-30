import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ArrowRight, Terminal, Database, LineChart, Cpu, Code } from 'lucide-react'
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

      <div className="container mx-auto py-12 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Badge className="mb-4 px-3.5 py-1.5" variant="outline">CROSSROAD v0.2.3</Badge>
          <h1 className="text-4xl font-bold mb-4">🚀 Crossroad</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze SSR patterns across genomes with scale, speed, and style
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5 text-primary" />
                    About croSSRoad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>croSSRoad is a powerful and user-friendly pipeline designed for comprehensive cross-genome comparison among multiple strains at the SSR level. It enables efficient identification of similarities and differences in SSR patterns across datasets.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="mr-2 h-5 w-5 text-primary" />
                    Key Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">🧬</span>
                      <span>Multi-genome SSR analysis with mutational hotspot detection & evolutionary insights</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">⚡</span>
                      <span>2 concurrent jobs & ⬆️ 500MB upload limit for efficient batch processing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">📦</span>
                      <span>Apache Arrow for fast, memory-efficient binary data handling</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🧵</span>
                      <span>Web Workers for multithreaded bulk data processing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">📊</span>
                      <span>ECharts & Vega for rendering 100K–1M+ data points interactively</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/analysis">
                    <Button variant="outline" size="sm">
                      Try Analysis <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cpu className="mr-2 h-5 w-5 text-primary" />
                    Tech Stack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">🧠</span>
                      <span>React Query + memoization for snappy, responsive UI</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🛠️</span>
                      <span>Built with TanStack Query, Table, Start, Router for modern SSR & routing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">💅</span>
                      <span>ShadCN UI for clean, accessible interface design</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🚦</span>
                      <span>FastAPI backend with job queuing for scalable async task management</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">⚙️</span>
                      <span>pnpm for lightning-fast builds and dependency resolution</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Terminal Window */}
            <div className="relative overflow-hidden rounded-xl border bg-background p-2">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex space-x-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-muted-foreground">croSSRoad Installation</div>
                  <div className="w-4"></div>
                </div>
                <div className="mt-4 font-mono text-sm text-foreground">
                  <div className="flex">
                    <span className="text-primary mr-2">$</span>
                    <span className="typing-animation">conda create -n crossroad python=3.11.12</span>
                  </div>
                  <div className="text-muted-foreground mt-1">Creating environment...</div>
                  <div className="text-green-500 mt-1">✓ Environment created successfully</div>
                  
                  <div className="flex mt-4">
                    <span className="text-primary mr-2">$</span>
                    <span>conda activate crossroad</span>
                  </div>
                  <div className="text-green-500 mt-1">✓ Environment activated</div>
                  
                  <div className="flex mt-4">
                    <span className="text-primary mr-2">$</span>
                    <span>mamba install -c jitendralab -c bioconda -c conda-forge crossroad -y</span>
                  </div>
                  <div className="text-muted-foreground mt-1">Installing packages...</div>
                  <div className="text-muted-foreground mt-1">Resolving dependencies...</div>
                  <div className="text-green-500 mt-1">✓ Installation complete</div>
                  
                  <div className="flex mt-4">
                    <span className="text-primary mr-2">$</span>
                    <span>crossroad --help</span>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    <pre className="text-xs overflow-auto">
{`usage: crossroad [-h] --fasta FASTA --categories CATEGORIES [--gene-bed GENE_BED]
                [--reference-id REFERENCE_ID] [--output-dir OUTPUT_DIR] [--flanks]
                [--mono MONO] [--di DI] [--tri TRI] [--tetra TETRA] [--penta PENTA]
                [--hexa HEXA] [--min-len MIN_LEN] [--max-len MAX_LEN] [--unfair UNFAIR]
                [--threads THREADS] [--min-repeat-count MIN_REPEAT_COUNT]
                [--min-genome-count MIN_GENOME_COUNT]`}
                    </pre>
                  </div>
                  
                  <div className="flex mt-4">
                    <span className="text-primary mr-2">$</span>
                    <span className="typing-animation">crossroad --fasta genome.fa --categories metadata.tsv --gene-bed genes.bed --min-len 156000 --max-len 10000000 -o results</span>
                  </div>
                  <div className="text-muted-foreground mt-1">Analysis running...</div>
                  <div className="text-green-500 mt-1">✓ Analysis complete! Results available in ./results</div>
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="mr-2 h-5 w-5 text-primary" />
                    Pipeline Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Provide input: multi-FASTA, metadata TSV, and gene BED files</li>
                    <li>Run croSSRoad to generate a <code>jobOut</code> folder with Main, Intermediate, and Plots subdirectories</li>
                    <li>Review main outputs (e.g., <code>mergedOut.tsv</code>, <code>hssr_data.csv</code>) and interactive HTML plots</li>
                    <li>Use generated CSV summaries and plots for downstream analysis</li>
                  </ol>
                </CardContent>
                <CardFooter>
                  <Link to="/">
                    <Button variant="outline" size="sm">
                      Back to Home
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}