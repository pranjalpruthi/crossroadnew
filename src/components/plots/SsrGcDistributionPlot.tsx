import React, { useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, ScatterChart, Maximize2 } from 'lucide-react'; // Added Maximize2
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import * as echarts from 'echarts/core';
import { ScatterChart as EScatterChart, LineChart } from 'echarts/charts'; // Import necessary chart types
import { GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, ToolboxComponent, DataZoomComponent } from 'echarts/components'; // Import necessary components
// Import Popover components
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button'; // Added Button
import { Separator } from '@/components/ui/separator'; // Added Separator

// Register necessary ECharts components
echarts.use([
    EScatterChart,
    LineChart, // Sometimes needed for tooltips or other features
    GridComponent,
    TooltipComponent,
    LegendComponent,
    VisualMapComponent, // For color mapping
    ToolboxComponent,
    DataZoomComponent // Import DataZoom component
]);


// Type for the data structure expected from the query result (plot_source)
interface PlotSourceDataRow {
  genomeID?: string | null;
  GC_per?: number | string | null; // Expecting GC_per column
  // Other fields might exist but are not used by this plot
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string;
    data: PlotSourceDataRow[] | null;
    error?: string;
};

// Define the structure for aggregated data used in the chart
interface AggregatedGenomeData {
    genomeID: string;
    motifCount: number;
    meanGC: number;
    symbolSize: number;
}

// Define the structure for the calculated statistics processed internally
interface ProcessedPlotStats {
    total_genomes: number;
    total_motifs: number; // Total motifs across all genomes
    overall_mean_gc: number;
    min_gc: number;
    max_gc: number;
}

// Props now accept the raw query result (expected to be plot_source)
interface SsrGcDistributionPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

const SsrGcDistributionPlot: React.FC<SsrGcDistributionPlotProps> = ({ queryResult }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    if (!queryData?.data || !Array.isArray(queryData.data) || queryData.data.length === 0) {
      return null;
    }

    const rawData = queryData.data as PlotSourceDataRow[];

    // --- Start of processing logic (adapted from Python) ---
    const df_proc = rawData
        .filter(row =>
            row.genomeID !== null && row.genomeID !== undefined && row.genomeID !== '' &&
            row.GC_per !== null && row.GC_per !== undefined // Check for null/undefined before conversion
        )
        .map(row => ({
            genomeID: String(row.genomeID!),
            GC_per: Number(row.GC_per), // Convert to number
        }))
        .filter(row => !isNaN(row.GC_per)); // Filter out rows where GC_per is NaN after conversion

    if (df_proc.length === 0) return null;

    // Group by GenomeID and Aggregate
    const genomeAggMap = df_proc.reduce((acc, row) => {
        if (!acc[row.genomeID]) {
            acc[row.genomeID] = { gcValues: [], count: 0 };
        }
        acc[row.genomeID].gcValues.push(row.GC_per);
        acc[row.genomeID].count++;
        return acc;
    }, {} as Record<string, { gcValues: number[], count: number }>);

    const genomeAggList = Object.entries(genomeAggMap).map(([genomeID, data]) => {
        const meanGC = data.gcValues.reduce((sum, val) => sum + val, 0) / data.count;
        return {
            genomeID,
            motifCount: data.count,
            meanGC: isNaN(meanGC) ? 0 : meanGC, // Handle potential NaN if count is 0 (shouldn't happen with filter)
        };
    }).sort((a, b) => a.genomeID.localeCompare(b.genomeID)); // Sort alphabetically by genomeID

    if (genomeAggList.length === 0) return null;

    // Calculate Symbol Size
    const min_size = 8;
    const size_scaling_factor = 0.5; // From Python
    const aggregatedData: AggregatedGenomeData[] = genomeAggList.map(item => ({
        ...item,
        symbolSize: Math.max(min_size, item.meanGC * size_scaling_factor)
    }));

    // --- End of processing logic ---

    // --- Calculate Stats ---
    const overallMeanGc = df_proc.reduce((sum, row) => sum + row.GC_per, 0) / df_proc.length;
    const gcValues = aggregatedData.map(d => d.meanGC);

    const stats: ProcessedPlotStats = {
        total_genomes: aggregatedData.length,
        total_motifs: aggregatedData.reduce((sum, item) => sum + item.motifCount, 0),
        overall_mean_gc: parseFloat(overallMeanGc.toFixed(2)),
        min_gc: parseFloat(Math.min(...gcValues).toFixed(2)),
        max_gc: parseFloat(Math.max(...gcValues).toFixed(2)),
    };
    // --- End Stats ---

    return { chartData: aggregatedData, stats };

  }, [queryData]); // Dependency: re-run when queryData changes

  // --- Fullscreen Logic ---
  const chartId = "ssr-gc-distribution-chart"; // Unique ID
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
        chartDiv.style.background = '#ffffff'; // Optional: set background for fullscreen
      } else if (chartDiv) {
        // Reset styles when exiting fullscreen
        chartDiv.style.height = 'auto'; // Or back to original style.height if needed
        chartDiv.style.padding = '0';
      }
      // Consider resizing the chart instance if necessary
      // const chartInstance = echarts.getInstanceByDom(chartDiv);
      // chartInstance?.resize();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [chartId]);
  // --- End Fullscreen Logic ---

  // --- Render Logic ---

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-lg flex items-center">
            <ScatterChart className="mr-2 h-5 w-5" />
            SSR GC Distribution Plot
          </CardTitle>
           {/* Placeholder for buttons */}
           <div className="flex items-center gap-2">
             <Skeleton className="h-8 w-24" /> {/* Stats button */}
             <Skeleton className="h-8 w-28" /> {/* Fullscreen button */}
           </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <Skeleton className="h-[400px] w-full" /> {/* Rectangular skeleton */}
           <Skeleton className="h-8 w-1/2" />
           <Skeleton className="h-6 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !processedData) {
    const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed for SSR GC Distribution.';
    return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <ScatterChart className="mr-2 h-5 w-5" />
             SSR GC Distribution Plot
           </CardTitle>
         </CardHeader>
         <CardContent>
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
         </CardContent>
       </Card>
    );
  }

  // Destructure chartData and stats from processedData
  const { chartData, stats } = processedData;

  // ECharts options configuration
  const options = {
    title: {
      text: 'SSR Distribution and GC Content Across Genomes',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'item', // Trigger on points
      formatter: (params: any) => {
        // params.data should be [genomeID, motifCount, meanGC, symbolSize]
        if (params.data && params.data.length >= 3) {
          return `<b>Genome ID:</b> ${params.data[0]}<br/>` +
                 `<b>Number of Motifs:</b> ${params.data[1].toLocaleString()}<br/>` +
                 `<b>Mean GC%:</b> ${params.data[2].toFixed(2)}%`;
        }
        return '';
      }
    },
    grid: {
        left: '8%', // Adjust margins for labels/axis
        right: '15%', // Adjust for visualMap
        bottom: '15%', // Adjust for rotated labels
        containLabel: false // Let automargin handle axis titles
    },
    xAxis: {
      type: 'category',
      name: 'Genome ID',
      nameLocation: 'middle',
      nameGap: 50, // Increase gap for rotated labels
      data: chartData.map(item => item.genomeID),
      axisLabel: {
          interval: 0, // Show all labels
          rotate: -45, // Rotate labels
          fontSize: 10,
      },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      axisTick: { show: true, alignWithLabel: true },
      splitLine: { show: false }, // Hide vertical grid lines
    },
    yAxis: {
      type: 'value',
      name: 'Number of SSR Motifs',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
          fontSize: 10,
          formatter: (value: number) => value.toLocaleString() // Format large numbers
      },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      splitLine: { lineStyle: { color: '#eef0f2' } }, // Keep horizontal grid lines
    },
    visualMap: {
        min: stats.min_gc,
        max: stats.max_gc,
        dimension: 2, // Map color to the 3rd element in data array (meanGC)
        orient: 'vertical',
        right: 10,
        top: 'center',
        text: ['High GC%', 'Low GC%'], // Text for visualMap slider
        calculable: true,
        inRange: {
            color: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'] // Example Yellow-Blue scale (Viridis-like)
        },
        textStyle: { fontSize: 10 }
    },
    series: [
      {
        name: 'Genomes', // Series name (optional)
        type: 'scatter',
        data: chartData.map(item => [item.genomeID, item.motifCount, item.meanGC, item.symbolSize]), // Data format: [x, y, visualMapDim, symbolSizeDim]
        symbolSize: (val: number[]) => val[3], // Use the 4th element for symbol size
        emphasis: {
          focus: 'series',
          label: { // Show label on emphasis
              show: true,
              formatter: (params: any) => params.data[0], // Show genomeID on hover
              position: 'top'
          }
        },
        itemStyle: {
            opacity: 0.8,
            borderColor: 'rgba(0,0,0,0.4)',
            borderWidth: 0.5
        }
      }
    ],
     toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'bottom',
        feature: {
            mark: { show: true },
            dataView: { show: true, readOnly: false, title: 'Data View' },
            restore: { show: true, title: 'Restore' },
            saveAsImage: { show: true, title: 'Save Image' }
         }
     },
     // Add dataZoom configuration for x-axis
     dataZoom: [
        {
            type: 'slider', // Slider control at the bottom
            xAxisIndex: 0, // Control the first x-axis
            filterMode: 'filter', // 'filter' mode is generally good for category axes
            start: 0, // Default start percentage
            end: 50, // Default end percentage (show first 50% initially) - adjust as needed
            height: 20, // Height of the slider
            bottom: 40, // Position above the bottom margin
        },
        {
            type: 'inside', // Enable zooming/panning inside the chart area
            xAxisIndex: 0,
            filterMode: 'filter',
            zoomOnMouseWheel: true, // Enable zooming with mouse wheel
            moveOnMouseMove: true, // Enable panning with mouse drag
            moveOnMouseWheel: false, // Disable moving chart with wheel (use for zoom)
        }
     ],
   };
 
   return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="text-lg flex items-center">
           <ScatterChart className="mr-2 h-5 w-5" />
           SSR GC Distribution Plot
        </CardTitle>
        {/* Button Group */}
        <div className="flex items-center gap-2">
          {/* Stats Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4" />
                <span className="ml-2">Stats</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs">
              <div className="space-y-2 p-2">
                <p className="font-medium text-sm mb-2 text-center">Summary Statistics</p>
                <Separator className="mb-3" />
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Total Genomes:</span>
                   <Badge variant="secondary">{stats.total_genomes.toLocaleString()}</Badge>
                </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Total Motifs:</span>
                   <Badge variant="secondary">{stats.total_motifs.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Overall Mean GC:</span>
                   <Badge variant="secondary">{stats.overall_mean_gc}%</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">GC Range:</span>
                   <Badge variant="outline">{stats.min_gc}% - {stats.max_gc}%</Badge>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Fullscreen Button */}
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
            <span className="ml-2">Fullscreen</span>
          </Button>
        </div>
      </CardHeader>
      {/* Chart Area takes full width */}
      <CardContent className="p-4">
         {/* Add ID to the chart container div */}
         <div id={chartId} className="relative">
           <ReactECharts
             option={options}
             style={{ height: '600px', width: '100%' }} // Adjusted height
             notMerge={true}
             lazyUpdate={true}
             theme={"light"}
           />
         </div>
      </CardContent>
    </Card>
  );
};

export default SsrGcDistributionPlot;
