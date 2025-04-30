import React, { useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, BarChartHorizontal, Loader2, Maximize2 } from 'lucide-react'; // Added Maximize2
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, ToolboxComponent } from 'echarts/components';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Register necessary ECharts components
echarts.use([
    BarChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent
]);

// Type for the data structure expected from the query result (ssr_gene_intersect)
interface SsrGeneIntersectDataRow {
  genomeID?: string | null;
  ssr_position?: string | null;
  // Other columns might exist but are not used here
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string; // Should be 'ssr_gene_intersect'
    data: SsrGeneIntersectDataRow[] | null;
    error?: string;
};

// Define the structure for aggregated data used in the chart
interface PositionCount {
    Position: string;
    Count: number;
}

// Define the structure for the calculated statistics processed internally
interface ProcessedPlotStats {
    reference_genome: string;
    total_ssrs_in_ref: number;
    max_count_per_position: number;
    min_count_per_position: number;
}

// Props for the component
interface ReferenceSsrDistributionPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
  referenceId: string | null; // The submitted reference ID
}

const ReferenceSsrDistributionPlot: React.FC<ReferenceSsrDistributionPlotProps> = ({ queryResult, referenceId }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    // Don't process if no reference ID was submitted or if data is missing/empty
    if (!referenceId || !queryData?.data || !Array.isArray(queryData.data) || queryData.data.length === 0) {
      return null;
    }

    const rawData = queryData.data as SsrGeneIntersectDataRow[];

    // --- Start of processing logic (adapted from Python) ---
    const df_proc = rawData
        .filter(row =>
            row.genomeID === referenceId && // Filter by reference ID
            row.ssr_position !== null && row.ssr_position !== undefined && row.ssr_position !== ''
        )
        .map(row => ({
            ssr_position: String(row.ssr_position!),
        }));

    if (df_proc.length === 0) {
        console.warn(`ReferenceSsrDistributionPlot: No data found for reference genome ${referenceId}.`);
        return null; // No data for the specific reference ID
    }

    // Count occurrences for the reference genome
    const positionCountsMap = df_proc.reduce((acc, row) => {
        acc[row.ssr_position] = (acc[row.ssr_position] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const positionCounts: PositionCount[] = Object.entries(positionCountsMap)
        .map(([Position, Count]) => ({ Position, Count }))
        .sort((a, b) => a.Position.localeCompare(b.Position)); // Sort alphabetically

    if (positionCounts.length === 0) return null;

    // --- End of processing logic ---

    // --- Calculate Stats ---
    const counts = positionCounts.map(pc => pc.Count);
    const total_ssrs = counts.reduce((sum, count) => sum + count, 0);
    const stats: ProcessedPlotStats = {
        reference_genome: referenceId,
        total_ssrs_in_ref: total_ssrs,
        max_count_per_position: Math.max(...counts),
        min_count_per_position: Math.min(...counts),
    };
    // --- End Stats ---

    return { chartData: positionCounts, stats };

  }, [queryData, referenceId]); // Re-run if data or referenceId changes

  // --- Fullscreen Logic ---
  const chartId = "reference-ssr-distribution-chart"; // Unique ID
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
        // Calculate height based on data when exiting fullscreen
        const chartData = processedData?.chartData;
        const chartHeight = chartData ? Math.max(300, chartData.length * 40 + 100) : 300;
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
  }, [chartId, processedData]); // Depend on processedData for height calc
  // --- End Fullscreen Logic ---

  // --- Render Logic ---

  if (isLoading) {
    return (
        <Card className="mt-6">
           <CardHeader className="flex flex-row items-center justify-between space-x-2">
             <CardTitle className="text-base flex items-center">
                <BarChartHorizontal className="mr-2 h-4 w-4" />
                Reference Genome SSR Distribution
             </CardTitle>
             {/* Placeholder for buttons */}
             <div className="flex items-center gap-2">
               <Skeleton className="h-8 w-24" /> {/* Stats button */}
               <Skeleton className="h-8 w-28" /> {/* Fullscreen button */}
             </div>
           </CardHeader>
           <CardContent>
              <Skeleton className="h-[300px] w-full" />
           </CardContent>
        </Card>
    );
  }
  if (isError || !referenceId || !processedData) {
    // ... error/no data JSX ...
     // Silently return null if no reference ID or no data for it
    if (!referenceId || !processedData && !isError) return null;

    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-base flex items-center">
             <BarChartHorizontal className="mr-2 h-4 w-4" />
             Reference Genome SSR Distribution
           </CardTitle>
           {/* Optionally add disabled buttons */}
         </CardHeader>
         <CardContent>
           {isError && (
             <Alert variant="destructive" className="mt-4">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error Loading Data</AlertTitle>
               <AlertDescription>
                 {error?.message || 'Failed to load data for reference SSR distribution.'}
               </AlertDescription>
             </Alert>
           )}
         </CardContent>
      </Card>
    )
  }

  // Destructure chartData and stats from processedData
  const { chartData, stats } = processedData;

  // ECharts options configuration
  const options = {
    title: {
      text: `Distribution of SSRs by Position in Reference (${stats.reference_genome})`,
      left: 'center',
      top: 5,
      textStyle: { fontSize: 14, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
       formatter: (params: any[]) => {
           const point = params[0];
           return `<b>Position:</b> ${point.name}<br/><b>Count:</b> ${point.value.toLocaleString()}`;
       }
    },
    grid: {
        left: '5%', // Adjust margins
        right: '15%', // Make space for stats box
        bottom: '10%',
        top: '15%', // Adjust for title
        containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'Count of SSRs',
      nameLocation: 'middle',
      nameGap: 25,
      axisLabel: { fontSize: 10, formatter: '{value}' },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      splitLine: { lineStyle: { color: '#eee' } },
    },
    yAxis: {
      type: 'category',
      name: 'SSR Position',
      nameLocation: 'middle',
      nameGap: 80, // Adjust based on label length
      data: chartData.map(item => item.Position),
      axisLabel: { fontSize: 10, interval: 0 },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      axisTick: { show: false },
      splitLine: { show: false },
      inverse: false // Keep natural order (e.g., IN, intersect_start, intersect_stop)
    },
    series: [
      {
        name: 'SSR Count',
        type: 'bar',
        data: chartData.map(item => item.Count),
        label: { // Show labels on bars
            show: true,
            position: 'right', // Position label outside the bar
            formatter: (params: any) => {
                const count = params.value;
                const percentage = stats.total_ssrs_in_ref > 0 ? ((count / stats.total_ssrs_in_ref) * 100).toFixed(1) : 0;
                return `${count.toLocaleString()} (${percentage}%)`;
            },
            fontSize: 9,
            color: '#333'
        },
        itemStyle: {
            // Use a color palette or a fixed color
            color: (params: any) => echarts.color.modifyHSL('#5470c6', params.dataIndex * 60) // Cycle hue
        },
        barMaxWidth: 40,
      }
    ],
     toolbox: {
        show: true,
        orient: 'vertical',
        right: 5,
        top: 'center',
        itemSize: 12,
        feature: {
            dataView: { show: true, readOnly: false, title: 'Data View' },
            restore: { show: true, title: 'Restore' },
            saveAsImage: { show: true, title: 'Save Image' }
        }
    },
  };

  // Calculate dynamic height
  const chartHeight = Math.max(300, chartData.length * 40 + 100);

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="text-base flex items-center">
           <BarChartHorizontal className="mr-2 h-4 w-4" />
           Reference Genome SSR Distribution
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
                   <span className="text-muted-foreground">Reference:</span>
                   <Badge variant="secondary" className="truncate max-w-[150px]">{stats.reference_genome}</Badge>
                </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Total SSRs:</span>
                   <Badge variant="secondary">{stats.total_ssrs_in_ref.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Max Count/Pos:</span>
                   <Badge variant="outline">{stats.max_count_per_position.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Min Count/Pos:</span>
                   <Badge variant="outline">{stats.min_count_per_position.toLocaleString()}</Badge>
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
      <CardContent className="p-4">
         {/* Add ID to the chart container div */}
         <div id={chartId} className="relative">
             <ReactECharts
               option={options}
               style={{ height: `${chartHeight}px`, width: '100%' }}
               notMerge={true}
               lazyUpdate={true}
               theme={"light"}
             />
         </div>
         {/* Removed the grid layout and stats column div */}
      </CardContent>
    </Card>
  );
};

export default ReferenceSsrDistributionPlot;
