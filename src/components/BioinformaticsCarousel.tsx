'use client'
import * as React from 'react'

// Bioinformatics data for carousel with videos
const data = [
  {
    title: 'Upload Multi-FASTA Files in 3 Clicks',
    description:
      'Select your FASTA files, provide metadata, and optionally include gene annotations - your SSR analysis pipeline is configured and ready to start.',
    video: '/1.mp4', // Would need real videos - using placeholders
  },
  {
    title: 'Advanced SSR Analysis Without Coding',
    description:
      'Whether you need motif frequency analysis or hotspot identification, croSSRoad processes genomic data automatically and identifies all simple sequence repeats with high accuracy.',
    video: '/2.mp4',
  },
  {
    title: 'Interactive Visualizations & Charts',
    description:
      'Explore your results through interactive heatmaps, dot plots, and Sankey diagrams - all generated automatically to help you identify patterns across multiple genomes.',
    video: '/3.mp4',
  },
  {
    title: 'Export Results for Publication',
    description:
      'Download publication-ready tables, figures, and comprehensive datasets in multiple formats to support your genomic research and ensure reproducibility.',
    video: '/4.mp4',
  },
]

export default function BioinformaticsCarousel() {
  const [active, setActive] = React.useState(0)
  const [progress, setProgress] = React.useState(0)
  const videoRefs = React.useRef<HTMLVideoElement[] | null[]>([])

  const handleShow = (index: number) => {
    setActive(index)
    setProgress(0)
    const video = videoRefs.current[index]
    if (video) {
      video.currentTime = 0
      video.play()
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white p-4 pt-16 xl:p-24 dark:bg-gray-950">
      <div className="flex w-full max-w-7xl flex-col items-center gap-6 xl:flex-row">
        <div className="w-full space-y-4 xl:w-5/12">
          {data.map((item, index) => (
            <button
              key={item.title}
              className={`relative w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-50 dark:border-slate-800 bg-white dark:bg-gray-900 px-4 py-6 opacity-50 duration-300 ${active === index && 'border-white dark:border-primary bg-primary/5 dark:bg-primary/10 !opacity-100'} `}
              onClick={() => handleShow(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleShow(index)
                }
              }}
            >
              <div className="flex w-full items-center justify-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border duration-300 ${
                    active === index
                      ? 'border-white bg-primary text-white dark:bg-primary/80'
                      : 'bg-white dark:bg-gray-800'
                  } `}
                >
                  {index + 1}
                </div>
                <h3
                  className={`text-left text-xl font-bold leading-6 ${active === index ? 'text-primary dark:text-primary' : 'text-muted-foreground'} `}
                >
                  {item.title}
                </h3>
              </div>
              <div className={`description ${active === index && 'active'} `}>
                <p className="text-muted-foreground text-left text-base leading-6">
                  {item.description}
                </p>
              </div>
              {active === index && (
                <div
                  className="transition-all"
                  style={{
                    width: `${progress}%`,
                    height: '5px',
                    background: 'hsl(var(--primary))',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    transitionDuration: '0.5s',
                  }}
                ></div>
              )}
            </button>
          ))}
        </div>

        <div className="bg-blur-background flex h-[560px] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-2xl xl:w-7/12">
          {data.map((item, index) => (
            <div
              key={item.title}
              className="relative flex h-[560px] w-full shrink-0 items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 duration-300"
              style={{
                transform: `translateY(-${active * 100}%)`,
              }}
            >
              {/* Fallback for missing videos - placeholder images */}
              <img
                src={`https://picsum.photos/1200/800?random=${index+1}`}
                alt={item.title}
                className="h-full w-full rounded-2xl object-cover"
              />
              {/* Uncomment this when you have real videos */}
              {/* <video
                ref={(el) => (videoRefs.current[index] = el)}
                className="h-full w-full rounded-2xl object-cover"
                autoPlay
                loop={false}
                muted
                onTimeUpdate={updateProgress}
                onEnded={handleVideoEnd}
              >
                <source src={item.video} type="video/mp4" />
              </video> */}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute top-0 flex w-full items-center justify-between border-b-2 border-primary/50 bg-slate-100 dark:bg-slate-900 px-6 py-2 font-semibold text-primary">
        <a
          className="text-primary underline underline-offset-2"
          href="https://github.com/csir-igib"
        >
          CSIR-IGIB
        </a>
        <a
          className="text-primary underline underline-offset-2"
          href="https://github.com/BioinformaticsOnLine/croSSRoad"
        >
          GitHub
        </a>
        <a
          className="text-primary underline underline-offset-2"
          href="/about"
        >
          About
        </a>
      </div>
    </main>
  )
} 