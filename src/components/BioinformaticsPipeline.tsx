import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline"
import { Code, Package, Database, Globe, Server } from "lucide-react"
import { useState, useEffect } from "react"

// Pipeline steps with brief descriptions and icons
const pipelineSteps = [
  {
    id: 1,
    date: "2024 December",
    title: "Initial Release",
    description: "Python prototype",
    icon: Code,
    completed: true
  },
  {
    id: 2,
    date: "2025 March",
    title: "Conda Package",
    description: "Bioconda distribution",
    icon: Package,
    completed: true
  },
  {
    id: 3,
    date: "2025 April",
    title: "PyPI Release",
    description: "pip install crossroad-cli",
    icon: Database,
    completed: true
  },
  {
    id: 4,
    date: "Now",
    title: "Web Platform",
    description: "Interactive UI",
    icon: Globe,
    completed: false
  },
  {
    id: 5,
    date: "Expected",
    title: "Distributed Compute",
    description: "High-scale processing",
    icon: Server,
    completed: false
  }
]

export default function BioinformaticsPipeline() {
  // Set the current active step (1-indexed)
  const currentStep = 4 // Web Platform Development
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768) // Consider tablets and phones as mobile
    }
    
    // Check on initial load
    checkIfMobile()
    
    // Set up window resize listener
    window.addEventListener('resize', checkIfMobile)
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  return (
    <div className="w-full py-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">Development Timeline</h2>
      </div>
      
      <Timeline 
        defaultValue={currentStep} 
        orientation={isMobile ? "vertical" : "horizontal"}
        className={isMobile ? "px-2 max-w-md mx-auto" : "px-2"}
      >
        {pipelineSteps.map((step) => {
          const IconComponent = step.icon
          return (
            <TimelineItem
              key={step.id}
              step={step.id}
              className={isMobile ? 
                "w-[calc(50%-1.5rem)] odd:ms-auto even:text-right even:group-data-[orientation=vertical]/timeline:ms-0 even:group-data-[orientation=vertical]/timeline:me-8 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:translate-x-1/2 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:translate-x-1/2" : 
                "relative"
              }
            >
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate className="text-xs">{step.date}</TimelineDate>
                <TimelineTitle className="text-xs sm:text-sm">{step.title}</TimelineTitle>
                <TimelineIndicator className="flex items-center justify-center">
                  <IconComponent className={`h-3 w-3 ${step.completed ? "text-primary" : "text-muted-foreground"}`} />
                </TimelineIndicator>
              </TimelineHeader>
              <TimelineContent className="text-[10px] sm:text-xs text-muted-foreground max-w-[100px] sm:max-w-[150px]">
                {step.description}
              </TimelineContent>
            </TimelineItem>
          )
        })}
      </Timeline>
    </div>
  )
} 