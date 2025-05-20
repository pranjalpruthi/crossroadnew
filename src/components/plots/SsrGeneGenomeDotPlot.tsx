import React, { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, Dot, Maximize2,  ChevronsUpDown,  } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, ToolboxComponent, VisualMapComponent, MarkAreaComponent, MarkLineComponent, DataZoomComponent } from 'echarts/components';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
echarts.use([
    ScatterChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent,
    VisualMapComponent,
    MarkAreaComponent,
    MarkLineComponent,
    DataZoomComponent
]);

// Type for the data structure expected from the query result (hssr_data)
interface HssrDataRow {
  genomeID?: string | null;
  gene?: string | null;
  motif?: string | null;
  repeat?: number | string | null;
  // Other columns might exist but are not used here
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string; // Should be 'hssr_data'
    data: HssrDataRow[] | null;
    error?: string;
};

// Define the structure for processed data points used in the chart
interface PlotPointData {
    genomeID: string;
    gene: string;
    motif: string;
    repeat: number;
    isReference: boolean;
    markerSize: number;
    // Raw data for tooltip: [gene, genomeID, motif, repeat, isReference, markerSize]
    value: [string, string, string, number, boolean, number];
}

// Define the structure for the calculated statistics processed internally
interface ProcessedPlotStats {
    total_points: number;
    unique_genes: number;
    unique_genomes: number;
    unique_motifs: number;
    min_repeat: number;
    max_repeat: number;
    reference_genome?: string | null;
}

// Props for the component
interface SsrGeneGenomeDotPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
  referenceId: string | null; // The submitted reference ID
}

// --- Helper Functions ---
// Define a standard color palette
const defaultColorPalette = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
];

function getMotifColor(motif: string, motifMap: Map<string, string>): string {
    if (!motifMap.has(motif)) {
        const colorIndex = motifMap.size % defaultColorPalette.length;
        motifMap.set(motif, defaultColorPalette[colorIndex]);
    }
    return motifMap.get(motif)!;
}

// Size scaling logic from Python code
function calculateMarkerSize(repeat: number, minRepeat: number, maxRepeat: number): number {
    const absoluteMinSize = 4;
    const absoluteMaxSize = 20;
    const sizeRange = maxRepeat - minRepeat;

    if (sizeRange <= 0) {
        return (absoluteMinSize + absoluteMaxSize) / 2;
    }

    // Use logarithmic scaling for better visualization when range is large
    if (sizeRange > 20) {
        // Ensure inputs to log are positive
        const safeMinRepeat = Math.max(0, minRepeat);
        const safeMaxRepeat = Math.max(0, maxRepeat);
        const safeRepeat = Math.max(0, repeat);

        const logMin = Math.log10(safeMinRepeat + 1); // Use Math.log10
        const logMax = Math.log10(safeMaxRepeat + 1); // Use Math.log10
        const logVal = Math.log10(safeRepeat + 1);   // Use Math.log10

        // Handle potential division by zero or invalid log results
        const normalized = (logMax > logMin) ? (logVal - logMin) / (logMax - logMin) : 0.5;
        return absoluteMinSize + normalized * (absoluteMaxSize - absoluteMinSize);
    } else {
        // Linear scaling for smaller ranges
        const normalized = (repeat - minRepeat) / sizeRange;
        return absoluteMinSize + normalized * (absoluteMaxSize - absoluteMinSize);
    }
}
// --- End Helper Functions ---


const SsrGeneGenomeDotPlot: React.FC<SsrGeneGenomeDotPlotProps> = ({ queryResult, referenceId }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // --- State for Filters ---
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [selectedGenomes, setSelectedGenomes] = useState<string[]>([]);
  const [geneFilterOpen, setGeneFilterOpen] = useState(false);
  const [genomeFilterOpen, setGenomeFilterOpen] = useState(false);
  // --- End State for Filters ---

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    if (!queryData?.data || !Array.isArray(queryData.data) || queryData.data.length === 0) {
      return null;
    }

    const rawData = queryData.data as HssrDataRow[];

    // --- Start of processing logic (adapted from Python) ---
    const requiredCols = ['genomeID', 'gene', 'motif', 'repeat'];
    const df_proc_initial = rawData
        .filter(row => requiredCols.every(col => row[col as keyof HssrDataRow] !== null && row[col as keyof HssrDataRow] !== undefined))
        .map(row => ({
            genomeID: String(row.genomeID!),
            gene: String(row.gene!),
            motif: String(row.motif!),
            repeat: Number(row.repeat),
        }))
        .filter(row => !isNaN(row.repeat) && row.repeat >= 0); // Ensure repeat is a non-negative number

    if (df_proc_initial.length === 0) return null;

    // --- Get *all* unique genes/genomes for filter options ---
    const allUniqueGenes = [...new Set(df_proc_initial.map(r => r.gene))].sort();
    const allUniqueGenomes = [...new Set(df_proc_initial.map(r => r.genomeID))].sort();
    // ---

    // --- Apply Filters ---
    const filtered_df = df_proc_initial.filter(row =>
        (selectedGenes.length === 0 || selectedGenes.includes(row.gene)) &&
        (selectedGenomes.length === 0 || selectedGenomes.includes(row.genomeID))
    );

    if (filtered_df.length === 0) {
        // Return all genes/genomes for filter UI, but indicate no plot data
        return {
            plotData: [],
            uniqueGenes: [],
            uniqueGenomes: [],
            uniqueMotifs: [],
            motifColorMap: new Map(),
            stats: null, // No stats if no data after filtering
            allUniqueGenes: allUniqueGenes, // Pass all for filter options
            allUniqueGenomes: allUniqueGenomes, // Pass all for filter options
            noFilteredData: true, // Flag to indicate filtering resulted in no data
        };
    }
    // --- End Apply Filters ---

    // --- Calculate based on *filtered* data ---
    const uniqueGenes = [...new Set(filtered_df.map(r => r.gene))].sort();
    const uniqueGenomes = [...new Set(filtered_df.map(r => r.genomeID))].sort();
    const uniqueMotifs = [...new Set(filtered_df.map(r => r.motif))].sort();

    const repeats = filtered_df.map(r => r.repeat).filter(r => r >= 0);
    if (repeats.length === 0) return null; // Should not happen if filtered_df is not empty

    const minRepeat = Math.min(...repeats);
    const maxRepeat = Math.max(...repeats);

    // Apply scaling and prepare final data structure for ECharts using *filtered* data
    const plotData: PlotPointData[] = filtered_df.map(row => {
        const isRef = !!referenceId && row.genomeID === referenceId;
        const markerSize = calculateMarkerSize(row.repeat, minRepeat, maxRepeat);
        return {
            ...row,
            isReference: isRef,
            markerSize: markerSize,
            value: [row.gene, row.genomeID, row.motif, row.repeat, isRef, markerSize]
        };
    });

    // Calculate Stats based on *filtered* data
    const stats: ProcessedPlotStats = {
        total_points: plotData.length,
        unique_genes: uniqueGenes.length,
        unique_genomes: uniqueGenomes.length,
        unique_motifs: uniqueMotifs.length,
        min_repeat: minRepeat,
        max_repeat: maxRepeat,
        reference_genome: referenceId && uniqueGenomes.includes(referenceId) ? referenceId : null, // Check if ref is in filtered list
    };
    // --- End Stats ---

    // Create motif color map from *filtered* motifs
    const motifColorMap = new Map<string, string>();
    uniqueMotifs.forEach(motif => getMotifColor(motif, motifColorMap));

    return {
        plotData,
        uniqueGenes, // Filtered genes for axis
        uniqueGenomes, // Filtered genomes for axis
        uniqueMotifs, // Filtered motifs
        motifColorMap,
        stats,
        allUniqueGenes, // Pass all for filter options
        allUniqueGenomes, // Pass all for filter options
        noFilteredData: false,
    };

  }, [queryData, referenceId, selectedGenes, selectedGenomes]); // Add filter state dependencies

  // --- Fullscreen Logic ---
  const chartId = "ssr-gene-genome-dot-plot"; // Unique ID
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
        // Consider resizing chart
        // const chartInstance = echarts.getInstanceByDom(chartDiv);
        // chartInstance?.resize();
      } else if (chartDiv) {
        // Calculate height based on data when exiting fullscreen
        const stats = processedData?.stats;
        const chartHeight = stats ? Math.max(600, stats.unique_genomes * 20 + 150) : 600;
        chartDiv.style.height = `${chartHeight}px`;
        chartDiv.style.padding = '0';
        // Consider resizing chart
        // const chartInstance = echarts.getInstanceByDom(chartDiv);
        // chartInstance?.resize();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [chartId, processedData]); // Depend on processedData to get stats for height calc
  // --- End Fullscreen Logic ---

  // --- Render Logic ---

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-base flex items-center">
            <Dot className="mr-2 h-4 w-4 animate-pulse" />
            SSR Gene/Genome Dot Plot
          </CardTitle>
           {/* Placeholder for buttons */}
           <div className="flex items-center gap-2">
             <Skeleton className="h-8 w-24" /> {/* Stats button */}
             <Skeleton className="h-8 w-28" /> {/* Fullscreen button */}
           </div>
        </CardHeader>
        <CardContent>
           <Skeleton className="h-[450px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !processedData || (!processedData.plotData && !processedData.noFilteredData)) {
    // Don't show error if data is simply missing/empty, only on actual fetch error
    if (isError) {
        return (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Dot className="mr-2 h-4 w-4" />
                  SSR Gene/Genome Dot Plot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading Plot Data</AlertTitle>
                  <AlertDescription>
                    {error?.message || 'Failed to load data for the SSR Gene/Genome Dot Plot.'}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
        );
    }
    // Render "no data" message if processing resulted in null
    return (
       <Card className="mt-6">
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-base flex items-center">
             <Dot className="mr-2 h-4 w-4" />
             SSR Gene/Genome Dot Plot
           </CardTitle>
         </CardHeader>
         <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Data</AlertTitle>
              <AlertDescription>
                No suitable data found in HSSR results to generate the SSR Gene/Genome Dot Plot.
              </AlertDescription>
            </Alert>
         </CardContent>
       </Card>
    );
  }

  // Destructure processed data (including the unfiltered lists for filters)
  const {
      plotData,
      uniqueGenes, // Filtered for axis
      uniqueGenomes, // Filtered for axis
      motifColorMap,
      stats,
      allUniqueGenes, // Unfiltered for filter UI
      allUniqueGenomes, // Unfiltered for filter UI
      noFilteredData,
  } = processedData;

  const referenceColor = "#FF5722";

  // ECharts options configuration - Uses *filtered* uniqueGenes/uniqueGenomes
  const options = {
    title: {
      text: 'SSR Distribution Across Genomes and Genes',
      subtext: `${stats?.total_points ?? 0} data points shown. ${stats?.reference_genome ? `Reference: ${stats.reference_genome}` : (referenceId ? 'Reference not in filtered data' : 'No Reference')}`,
      left: 'center',
      top: 5,
      textStyle: { fontSize: 16, fontWeight: 'bold' },
      subtextStyle: { fontSize: 12, color: stats?.reference_genome ? referenceColor : '#666' }
    },
    grid: {
        left: '10%', 
        right: '15%', // Further increased right margin for toolbox and y-axis dataZoom
        bottom: '12%', 
        top: 80,    
        containLabel: true 
    },
    tooltip: {
      trigger: 'item', // Trigger on individual points
      formatter: (params: any) => {
        // params.value should be [gene, genomeID, motif, repeat, isReference, markerSize]
        if (params.value && params.value.length >= 5) {
          const [gene, genomeID, motif, repeat, isReference] = params.value;
          let refText = isReference ? ' <strong style="color:'+referenceColor+';">(Reference)</strong>' : '';
          return `<b>Genome:</b> ${genomeID}${refText}<br/>` +
                 `<b>Gene:</b> ${gene}<br/>` +
                 `<b>Motif:</b> ${motif}<br/>` +
                 `<b>Repeat Count:</b> ${repeat}`;
        }
        return 'No data';
      }
    },
    xAxis: {
      type: 'category',
      name: 'Gene',
      nameLocation: 'middle',
      nameGap: 30, // Reduced gap for rotated labels
      data: uniqueGenes,
      axisLabel: {
          interval: 0, // Show all labels initially
          rotate: -45,
          fontSize: 9,
      },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      axisTick: { show: true, alignWithLabel: true },
      splitLine: { show: false }, // No vertical grid lines
    },
    yAxis: {
      type: 'category',
      name: 'Genome ID',
      nameLocation: 'middle',
      nameGap: 85, // Adjust based on longest genome ID
      data: uniqueGenomes,
      axisLabel: {
          interval: 0, // Show all labels
          fontSize: 9,
      },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#eee' } }, // Horizontal grid lines
      inverse: false // Genomes sorted alphabetically bottom to top
    },
    legend: {
        show: false, // Disable default legend - too complex to represent all info
    },
    series: stats ? [ // Only add series if stats (and thus filtered data) exist
      {
        name: 'SSR Data',
        type: 'scatter',
        data: plotData.map(p => p.value),
        symbolSize: (val: any[]) => val[5],
        itemStyle: {
            color: (params: any) => {
                const isRef = params.value[4];
                const motif = params.value[2];
                return isRef ? referenceColor : motifColorMap.get(motif) || '#808080';
            },
            opacity: (params: any) => params.value[4] ? 1.0 : 0.8,
            borderColor: (params: any) => params.value[4] ? 'black' : 'rgba(0,0,0,0)',
            borderWidth: (params: any) => params.value[4] ? 1.5 : 0,
        },
        markArea: stats.reference_genome && uniqueGenomes.includes(stats.reference_genome) ? {
           silent: true, // Non-interactive
           itemStyle: {
               color: '#FFF9C4', // Light yellow background
               opacity: 0.4
           },
           data: [[ { yAxis: stats.reference_genome, xAxis: uniqueGenes[0] }, { yAxis: stats.reference_genome, xAxis: uniqueGenes[uniqueGenes.length - 1] } ]]
        } : undefined,
        markLine: stats.reference_genome && uniqueGenomes.includes(stats.reference_genome) ? {
            silent: true,
            symbol: 'none', // No arrows
            lineStyle: {
                color: '#FF9800', // Orange line
                type: 'solid',
                width: 1.5
            },
            data: [{ yAxis: stats.reference_genome }]
        } : undefined,
      }
    ] : [], // Empty series if no filtered data
    toolbox: {
        show: true,
        orient: 'vertical',
        right: 35, // Position toolbox further from the edge
        top: 'center',
        itemSize: 12,
        feature: {
            dataZoom: { yAxisIndex: 'none', title: { zoom: 'Zoom', back: 'Restore' } },
            dataView: { show: true, readOnly: false, title: 'Data View' },
            restore: { show: true, title: 'Restore' },
            saveAsImage: { show: true, title: 'Save Image' }
        }
    },
    dataZoom: [ 
        { type: 'inside', xAxisIndex: 0, filterMode: 'filter', zoomOnMouseWheel: true, moveOnMouseMove: true },
        { type: 'slider', xAxisIndex: 0, filterMode: 'filter', bottom: 20, height: 15 }, 
        { type: 'inside', yAxisIndex: 0, filterMode: 'filter', zoomOnMouseWheel: true, moveOnMouseMove: true },
        { type: 'slider', yAxisIndex: 0, filterMode: 'filter', right: 10, width: 15 } // Position y-slider to the right of toolbox
    ],
  };

  // Calculate dynamic height based on *filtered* genomes
  const chartHeight = Math.max(600, (stats?.unique_genomes ?? 0) * 20 + 150);
  const chartWidth = Math.max(800, (stats?.unique_genes ?? 0) * 15 + 200);

  // --- Filter Component Rendering ---
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
                                      // Keep popover open for multi-select: setIsOpen(true);
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

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 space-y-2 sm:space-y-0">
        <CardTitle className="text-base flex items-center">
           <Dot className="mr-2 h-4 w-4" />
           SSR Gene/Genome Dot Plot
        </CardTitle>
        {/* Button & Filter Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Gene Filter */}
          {allUniqueGenes.length > 0 && renderMultiSelectFilter(
              'Genes',
              allUniqueGenes,
              selectedGenes,
              setSelectedGenes,
              geneFilterOpen,
              setGeneFilterOpen
          )}
          {/* Genome Filter */}
           {allUniqueGenomes.length > 0 && renderMultiSelectFilter(
              'Genomes',
              allUniqueGenomes,
              selectedGenomes,
              setSelectedGenomes,
              genomeFilterOpen,
              setGenomeFilterOpen
          )}
          {/* Stats Popover */}
          {stats && ( // Only show stats popover if there is filtered data
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
                      {stats.reference_genome && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reference:</span>
                          <Badge variant="outline" style={{ color: referenceColor, borderColor: referenceColor }}>{stats.reference_genome}</Badge>
                        </div>
                      )}
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">Data Points:</span>
                         <Badge variant="secondary">{stats.total_points.toLocaleString()}</Badge>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">Unique Genes:</span>
                         <Badge variant="secondary">{stats.unique_genes.toLocaleString()}</Badge>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">Unique Genomes:</span>
                         <Badge variant="secondary">{stats.unique_genomes.toLocaleString()}</Badge>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">Unique Motifs:</span>
                         <Badge variant="secondary">{stats.unique_motifs.toLocaleString()}</Badge>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">Repeat Range:</span>
                         <Badge variant="outline">{stats.min_repeat} - {stats.max_repeat}</Badge>
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
      <CardContent className="overflow-x-auto p-4">
         {/* Add ID to the chart container div */}
         <div id={chartId} className="relative">
            {noFilteredData ? (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    No data matches the selected filters.
                </div>
            ) : (
                 <ReactECharts
                   option={options}
                   style={{ height: `${chartHeight}px`, minWidth: `${chartWidth}px`, width: '100%' }}
                   notMerge={true}
                   lazyUpdate={true}
                   theme={"light"}
                 />
            )}
         </div>
         {/* Simple Legend Explanation */}
         <div className="text-xs text-muted-foreground mt-2 text-center">
             Dot size indicates repeat count. Color indicates motif (see tooltip). {stats?.reference_genome ? `Reference (${stats.reference_genome}) highlighted.` : ''}
         </div>
      </CardContent>
    </Card>
  );
};

export default SsrGeneGenomeDotPlot;
