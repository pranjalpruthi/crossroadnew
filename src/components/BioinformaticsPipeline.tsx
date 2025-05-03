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
import { Check } from "lucide-react"

const pipelineSteps = [
  {
    id: 1,
    date: "May 2023",
    title: "Prototype & Algorithm Development",
    description: "Initial SSR detection algorithms and Python prototype.",
    completed: true
  },
  {
    id: 2,
    date: "Sep 2023",
    title: "Anaconda Package Release",
    description: "Distributed as conda package for bioinformatics community.",
    completed: true
  },
  {
    id: 3,
    date: "Jan 2024",
    title: "PyPI Package Release",
    description: "Published on PyPI with enhanced documentation and test suite.",
    completed: true
  },
  {
    id: 4,
    date: "Present",
    title: "Web Platform Development",
    description: "Interactive visualization and analysis UI with React and TanStack.",
    completed: false
  },
  {
    id: 5,
    date: "Upcoming",
    title: "Distributed Computing Support",
    description: "Scaling for large-scale genomic datasets with parallel processing.",
    completed: false
  }
]

export default function BioinformaticsPipeline() {
  // Set the current active step (1-indexed)
  const currentStep = 4 // Web Platform Development

  return (
    <div className="w-full py-8 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Development Roadmap</h2>
        <p className="text-muted-foreground">croSSRoad evolution from prototype to production platform</p>
      </div>
      
      <Timeline defaultValue={currentStep} orientation="horizontal" className="px-4">
        {pipelineSteps.map((step) => (
          <TimelineItem key={step.id} step={step.id} className="relative">
            <TimelineHeader>
              <TimelineSeparator />
              <TimelineDate className="text-xs">{step.date}</TimelineDate>
              <TimelineTitle className="text-sm">{step.title}</TimelineTitle>
              <TimelineIndicator className="flex items-center justify-center">
                {step.completed && <Check className="h-2.5 w-2.5 text-primary" />}
              </TimelineIndicator>
            </TimelineHeader>
            <TimelineContent className="text-xs text-muted-foreground max-w-[150px]">
              {step.description}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  )
} 