import React, { useMemo, useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, Maximize2, AlertCircle, Check, ChevronsUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent, ToolboxComponent, DataZoomComponent } from 'echarts/components';
import type { EChartsCoreOption } from 'echarts/core';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';

// Register necessary ECharts components
echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, ToolboxComponent, DataZoomComponent]);

// Type for rows from plot_source (reformatted.tsv)
interface PlotSourceDataRow {
  genomeID?: string | null;
  motif?: string | null;
}

type QueryFnData = {
  plotKey: string;
  data: PlotSourceDataRow[] | null;
  error?: string;
};

// Define stats structure
interface ProcessedPlotStats {
  totalGenomes: number;
  totalMotifs: number;
  totalOccurrences: number;
  maxCount: number;
}

interface MotifDistributionHeatmapProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

const MotifDistributionHeatmap: React.FC<MotifDistributionHeatmapProps> = ({ queryResult }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // --- State for Filters ---
  // Keep initial state empty
  const [selectedGenomes, setSelectedGenomes] = useState<string[]>([]);
  const [selectedMotifs, setSelectedMotifs] = useState<string[]>([]);
  const [genomeFilterOpen, setGenomeFilterOpen] = useState(false);
  const [motifFilterOpen, setMotifFilterOpen] = useState(false);
  // --- End State for Filters ---

  // --- State to track if initial filter is set ---
  const [initialFilterApplied, setInitialFilterApplied] = useState(false);
  // --- End State ---


  const processed = useMemo(() => {
    const raw = queryData?.data;
    if (!raw || !Array.isArray(raw) || raw.length === 0) return null;

    // --- Initial Processing & Get All Options ---
    // Use a more efficient way to process initial data
    const df_proc_initial = raw.reduce((acc, r) => {
      if (r.genomeID && r.motif) {
        acc.push({
          genomeID: String(r.genomeID),
          motif: String(r.motif)
        });
      }
      return acc;
    }, [] as Array<{ genomeID: string; motif: string }>);

    if (df_proc_initial.length === 0) return null;

    // Use Set for unique values
    const genomeSet = new Set<string>();
    const motifSet = new Set<string>();
    df_proc_initial.forEach(r => {
      genomeSet.add(r.genomeID);
      motifSet.add(r.motif);
    });

    const allUniqueGenomes = Array.from(genomeSet).sort();
    const allUniqueMotifs = Array.from(motifSet).sort();
    // --- End Initial Processing ---

    // --- Apply Filters ---
    const genomesToFilter = initialFilterApplied ? selectedGenomes : [];
    const motifsToFilter = initialFilterApplied ? selectedMotifs : [];

    // Optimize filter logic
    const shouldFilterGenomes = genomesToFilter.length > 0;
    const shouldFilterMotifs = motifsToFilter.length > 0;

    const filtered_df = df_proc_initial.filter(row => {
      if (shouldFilterGenomes && !genomesToFilter.includes(row.genomeID)) return false;
      if (shouldFilterMotifs && !motifsToFilter.includes(row.motif)) return false;
      return true;
    });

    if (filtered_df.length === 0) {
      return {
        genomes: [], motifs: [], data: [], maxCount: 0, stats: null,
        allUniqueGenomes, allUniqueMotifs, noFilteredData: true
      };
    }
    // --- End Apply Filters ---

    // --- Calculate based on *filtered* data ---
    const filteredGenomeSet = new Set<string>();
    const filteredMotifSet = new Set<string>();
    const counts: Record<string, Record<string, number>> = {};

    // Single pass to collect all necessary data
    filtered_df.forEach(({ genomeID, motif }) => {
      filteredGenomeSet.add(genomeID);
      filteredMotifSet.add(motif);
      
      if (!counts[genomeID]) counts[genomeID] = {};
      counts[genomeID][motif] = (counts[genomeID][motif] || 0) + 1;
    });

    const genomes = Array.from(filteredGenomeSet).sort();
    const motifs = Array.from(filteredMotifSet).sort();

    // Pre-allocate data array for better performance
    const data: [number, number, number][] = new Array(genomes.length * motifs.length);
    let totalOccurrences = 0;
    let maxCount = 0;

    // Use indices for better performance
    for (let i = 0; i < genomes.length; i++) {
      const gen = genomes[i];
      for (let j = 0; j < motifs.length; j++) {
        const mo = motifs[j];
        const count = counts[gen]?.[mo] || 0;
        data[i * motifs.length + j] = [j, i, count];
        totalOccurrences += count;
        maxCount = Math.max(maxCount, count);
      }
    }

    const stats: ProcessedPlotStats = {
      totalGenomes: genomes.length,
      totalMotifs: motifs.length,
      totalOccurrences,
      maxCount
    };

    return {
      genomes,
      motifs,
      data,
      maxCount,
      stats,
      allUniqueGenomes,
      allUniqueMotifs,
      noFilteredData: false
    };
  }, [queryData, selectedGenomes, selectedMotifs, initialFilterApplied]);

  // --- Effect to set initial filter ---
  useEffect(() => {
    // Only run once after data is loaded and processed has run at least once
    if (processed?.allUniqueGenomes && processed.allUniqueGenomes.length > 0 && !initialFilterApplied) {
      // Select the first N genomes (e.g., 20) or fewer if not available
      const initialGenomes = processed.allUniqueGenomes.slice(0, 20);
      setSelectedGenomes(initialGenomes);
      setInitialFilterApplied(true); // Mark that the initial filter is set
    }
  }, [processed, initialFilterApplied]); // Depend on processed and the flag
  // --- End Effect ---


  // --- Fullscreen Logic ---
  const chartId = "motif-distribution-heatmap"; // Use consistent ID
  const toggleFullscreen = () => {
    const chartDiv = document.getElementById(chartId);
    if (chartDiv) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        chartDiv.requestFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const chartDiv = document.getElementById(chartId);
      if (chartDiv && document.fullscreenElement === chartDiv) {
        chartDiv.style.height = '100vh';
        chartDiv.style.padding = '20px';
        chartDiv.style.background = '#ffffff';
      } else if (chartDiv) {
        // Reset to original height or auto
         const stats = processed?.stats;
         const chartHeight = stats ? Math.max(700, stats.totalGenomes * 15 + 200) : 700;
         chartDiv.style.height = `${chartHeight}px`;
         chartDiv.style.padding = '0';
      }
       // Consider resizing chart
       // const chartInstance = echarts.getInstanceByDom(chartDiv);
       // chartInstance?.resize();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [chartId, processed]); // Depend on processed for height calc
  // --- End Fullscreen Logic ---

  // --- Render Logic ---

  // Modify loading state slightly if needed, or keep as is
  if (isLoading || (!initialFilterApplied && !isError && queryData?.data && queryData.data.length > 0)) {
     // Show skeleton while data loads OR while the initial filter is being applied
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-lg flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Motif Distribution Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
             {/* Keep skeleton filters */}
            <Skeleton className="h-8 w-[150px]" />
            <Skeleton className="h-8 w-[150px]" />
            <Skeleton className="h-8 w-24" /> {/* Stats button skeleton */}
            <Skeleton className="h-8 w-28" /> {/* Fullscreen button skeleton */}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
           {/* Add a text indicator maybe */}
           <div className="flex justify-center pt-2">
             <p className="text-sm text-muted-foreground">Loading and processing data...</p>
           </div>
        </CardContent>
      </Card>
    );
  }


  // Error and No Data Handling (might need slight adjustment based on initial filter logic)
   if (isError || !processed || (!processed.stats && !processed.noFilteredData && initialFilterApplied)) { // Check initialFilterApplied here
     return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <Info className="mr-2 h-5 w-5" />
             Motif Distribution Heatmap
           </CardTitle>
         </CardHeader>
         <CardContent>
           {isError ? (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error?.message || 'Failed to load heatmap data.'}</AlertDescription>
             </Alert>
           ) : (
             <Alert>
               <Info className="h-4 w-4" />
               <AlertTitle>No Data</AlertTitle>
               <AlertDescription>Initial data processing failed or resulted in no data.</AlertDescription>
             </Alert>
           )}
         </CardContent>
       </Card>
     );
   }

  // Destructure processed data
  const { genomes, motifs, data, maxCount, stats, allUniqueGenomes, allUniqueMotifs, noFilteredData } = processed;

  // ECharts options - uses *filtered* genomes/motifs
  const options: EChartsCoreOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        if (!params.value || params.value.length < 3) return ''; // Guard against errors
        const [x, y, value] = params.value;
        // Access filtered genomes/motifs arrays which correspond to the indices
        const genomeName = genomes[y] ?? 'N/A';
        const motifName = motifs[x] ?? 'N/A';
        return `Genome: ${genomeName}<br/>Motif: ${motifName}<br/>Count: ${value}`;
      }
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '5%',
      bottom: '10%'
    },
    xAxis: {
      type: 'category',
      data: motifs,
      name: 'Motif',
      nameLocation: 'middle',
      nameGap: 40,
      axisLabel: { rotate: 90, interval: 0 }
    },
    yAxis: {
      type: 'category',
      data: genomes,
      name: 'Genome',
      nameLocation: 'middle',
      nameGap: 140,
      axisLabel: { interval: 0, fontSize: 9 }
    },
    visualMap: {
      min: 0,
      max: maxCount > 0 ? maxCount : 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 5
    },
    series: stats ? [
      {
        name: 'Motif Count',
        type: 'heatmap',
        data: data,
        emphasis: {
          itemStyle: {
            borderColor: '#333',
            borderWidth: 1
          }
        }
      }
    ] : [],
    toolbox: {
      show: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        dataView: { show: true, readOnly: false },
        saveAsImage: {
          show: true,
          title: 'Save Image',
          pixelRatio: 6,
          name: 'motif_distribution_heatmap',
          connectedBackgroundColor: '#fff',
          excludeComponents: ['toolbox'],
          type: 'png'
        },
         restore: { show: true },
      }
    },
    dataZoom: [
      { type: 'slider', xAxisIndex: 0, filterMode: 'filter', start: 0, end: 50, height: 20, bottom: 35 },
      { type: 'slider', yAxisIndex: 0, filterMode: 'filter', start: 0, end: 50, width: 20, right: 40 },
      { type: 'inside', xAxisIndex: 0, filterMode: 'filter' },
      { type: 'inside', yAxisIndex: 0, filterMode: 'filter' }
    ],
  };

   // --- Filter Component Rendering --- (Copied from SsrGeneGenomeDotPlot)
   const renderMultiSelectFilter = (
       label: string,
       options: string[],
       selected: string[],
       setSelected: (value: string[]) => void,
       isOpen: boolean,
       setIsOpen: (open: boolean) => void
   ) => (
       <Popover open={isOpen} onOpenChange={setIsOpen}>
           <PopoverTrigger asChild>
               <Button
                   variant="outline"
                   role="combobox"
                   aria-expanded={isOpen}
                   size="sm"
                   className="w-[150px] justify-between text-xs h-8"
               >
                   <span className="truncate">
                     {selected.length === 0
                         ? `Filter ${label}...`
                         : selected.length === 1
                         ? selected[0]
                         : `${selected.length} ${label} selected`}
                   </span>
                   <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
               </Button>
           </PopoverTrigger>
           <PopoverContent className="w-[250px] p-0">
               <Command>
                   <CommandInput placeholder={`Search ${label}...`} className="h-9" />
                   <CommandList>
                       <CommandEmpty>No {label} found.</CommandEmpty>
                       <CommandGroup>
                           {/* Option to select/deselect all */}
                            <CommandItem
                                 key="select-all"
                                 value="select-all"
                                 onSelect={() => {
                                     if (selected.length === options.length) {
                                         setSelected([]); // Deselect all
                                     } else {
                                         setSelected(options); // Select all
                                     }
                                 }}
                             >
                                 <Checkbox
                                     checked={selected.length === options.length}
                                     className={cn("mr-2 h-4 w-4")}
                                 />
                                 Select All ({options.length})
                             </CommandItem>
                           {options.map((option) => (
                               <CommandItem
                                   key={option}
                                   value={option}
                                   onSelect={(currentValue) => {
                                       const isSelected = selected.includes(currentValue);
                                       if (isSelected) {
                                           setSelected(selected.filter(s => s !== currentValue));
                                       } else {
                                           setSelected([...selected, currentValue]);
                                       }
                                   }}
                               >
                                   <Checkbox
                                       checked={selected.includes(option)}
                                       className={cn("mr-2 h-4 w-4")}
                                   />
                                   {option}
                               </CommandItem>
                           ))}
                       </CommandGroup>
                   </CommandList>
               </Command>
           </PopoverContent>
       </Popover>
   );
   // --- End Filter Component Rendering ---

   // Calculate dynamic height based on *filtered* genomes
   const chartHeight = Math.max(700, (stats?.totalGenomes ?? 0) * 15 + 200);

   return (
     <Card>
       <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 space-y-2 sm:space-y-0">
         <CardTitle className="text-lg flex items-center">
           <Info className="mr-2 h-5 w-5" />
           Motif Distribution Heatmap
         </CardTitle>
          {/* Button & Filter Group */}
         <div className="flex flex-wrap items-center gap-2">
            {/* Genome Filter - Pass allUniqueGenomes */}
            {processed?.allUniqueGenomes && processed.allUniqueGenomes.length > 0 && renderMultiSelectFilter(
               'Genomes',
               processed.allUniqueGenomes, // Use all options for the dropdown
               selectedGenomes, // Current selection
               setSelectedGenomes,
               genomeFilterOpen,
               setGenomeFilterOpen
           )}
            {/* Motif Filter - Pass allUniqueMotifs */}
            {processed?.allUniqueMotifs && processed.allUniqueMotifs.length > 0 && renderMultiSelectFilter(
               'Motifs',
               processed.allUniqueMotifs, // Use all options for the dropdown
               selectedMotifs, // Current selection
               setSelectedMotifs,
               motifFilterOpen,
               setMotifFilterOpen
           )}
           {/* Stats Popover */}
           {stats && (
             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="outline" size="sm" className="h-8">
                   <Info className="h-4 w-4" />
                   <span className="ml-2">Stats</span>
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-64 text-xs">
                 <div className="space-y-2 p-2">
                   <p className="font-medium text-sm mb-2 text-center">Summary (Filtered)</p>
                   <Separator className="mb-3" />
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Genomes Shown:</span>
                      <Badge variant="secondary">{stats.totalGenomes.toLocaleString()}</Badge>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Motifs Shown:</span>
                      <Badge variant="secondary">{stats.totalMotifs.toLocaleString()}</Badge>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Occurrences Shown:</span>
                      <Badge variant="secondary">{stats.totalOccurrences.toLocaleString()}</Badge>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Count/Cell:</span>
                      <Badge variant="secondary">{stats.maxCount.toLocaleString()}</Badge>
                   </div>
                 </div>
               </PopoverContent>
             </Popover>
           )}
           {/* Fullscreen Button */}
           <Button variant="outline" size="sm" onClick={toggleFullscreen} className="h-8">
             <Maximize2 className="h-4 w-4" />
             <span className="ml-2">Fullscreen</span>
           </Button>
         </div>
       </CardHeader>
       <CardContent className="p-4 overflow-x-auto">
         <div id={chartId} className="relative">
           {noFilteredData ? (
               <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                   No data matches the selected filters.
               </div>
           ) : (
                <ReactECharts
                 option={options}
                 style={{ height: `${chartHeight}px`, minWidth: '600px', width: '100%' }}
                 notMerge
                 lazyUpdate
               />
           )}
         </div>
       </CardContent>
     </Card>
   );
 };

 export default MotifDistributionHeatmap;
