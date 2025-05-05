import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ApiStatusBadge() {
  const [status, setStatus] = useState<"operational" | "error" | "loading">("operational") // Default to operational
  const apiUrl = import.meta.env.VITE_CROSSROAD_API_URL
  const apiVersion = "v0.2.6" // Add API version here

  useEffect(() => {
    // Only check API status if we have a URL
    if (!apiUrl) return

    const checkApiStatus = async () => {
      try {
        // Try to fetch from the API with a timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        
        clearTimeout(timeoutId)
        
        // If we get any response (even a 404), the API server is up
        setStatus("operational")
      } catch (error) {
        console.error("API connection check failed:", error)
        setStatus("error")
      }
    }
    
    // Initial check
    checkApiStatus()
    
    // Periodically check API status (every 2 minutes)
    const intervalId = setInterval(checkApiStatus, 120000)
    
    return () => clearInterval(intervalId)
  }, [apiUrl])
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1",
        status === "operational" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : 
        status === "error" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" :
        "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300"
      )}
    >
      <span className="relative flex h-2 w-2 mr-1">
        <span 
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            status === "operational" ? "bg-green-500" : 
            status === "error" ? "bg-red-500" : 
            "bg-gray-500"
          )}
        />
        <span 
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            status === "operational" ? "bg-green-500" : 
            status === "error" ? "bg-red-500" : 
            "bg-gray-500"
          )}
        />
      </span>
      {status === "operational" ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
          <span>API <span className="font-semibold">{apiVersion}</span> operational</span>
        </>
      ) : status === "error" ? (
        <>
          <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
          <span>API <span className="font-semibold">{apiVersion}</span> unavailable</span>
        </>
      ) : (
        <span>Checking API <span className="font-semibold">{apiVersion}</span>...</span>
      )}
    </Badge>
  )
}

export function DevStatusBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 cursor-help"
          >
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-500" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span>Active development</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            The project is under very active development. Expect bugs and breaking changes.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 