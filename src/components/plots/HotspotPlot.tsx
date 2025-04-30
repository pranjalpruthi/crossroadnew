import React, { useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, Flame, Maximize2 } from 'lucide-react'; // Added Maximize2
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts'; // Using BarChart
import { GridComponent, TooltipComponent, LegendComponent, ToolboxComponent, DataZoomComponent } from 'echarts/components';
import { Button } from '@/components/ui/button'; // Added Button
import { Separator } from '@/components/ui/separator'; // Added Separator
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Register necessary ECharts components
echarts.use([
    BarChart,
    LineChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent,
    DataZoomComponent
]);

// Type for the data structure expected from the query result (hotspot)
interface HotspotDataRow {
  motif?: string | null;
  gene?: string | null;
  repeat_count?: number | string | null;
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string; // Should be 'hotspot'
    data: HotspotDataRow[] | null;
    error?: string;
};


// Define the structure for the calculated statistics processed internally
interface ProcessedPlotStats {
    total_occurrences: number;
    total_unique_motifs: number;
    total_unique_genes: number;
    total_repeat_count: number;
    top_genes: { name: string; count: number; percentage: number }[];
}

// Props now accept the raw query result
interface HotspotPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

const HotspotPlot: React.FC<HotspotPlotProps> = ({ queryResult }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    if (!queryData?.data || !Array.isArray(queryData.data) || queryData.data.length === 0) {
      return null;
    }

    const rawData = queryData.data as HotspotDataRow[];

    // --- Start of processing logic (adapted from Python) ---
    const df_proc = rawData
        .filter(row =>
            row.motif !== null && row.motif !== undefined && row.motif !== '' &&
            row.gene !== null && row.gene !== undefined && row.gene !== '' &&
            row.repeat_count !== null && row.repeat_count !== undefined
        )
        .map((row, index) => ({
            occurrenceIndex: index, // Use original index for y-axis
            motif: String(row.motif!),
            gene: String(row.gene!),
            repeatCount: Number(row.repeat_count),
        }))
        .filter(row => !isNaN(row.repeatCount) && row.repeatCount > 0);

    if (df_proc.length === 0) return null;

    const uniqueGenes = [...new Set(df_proc.map(r => r.gene))].sort();
    const uniqueMotifs = [...new Set(df_proc.map(r => r.motif))];
    const totalOccurrences = df_proc.length;
    const totalRepeatCount = df_proc.reduce((sum, row) => sum + row.repeatCount, 0);

    // --- End of processing logic ---

    // --- Calculate Stats ---
    const geneRepeatSums = df_proc.reduce((acc, row) => {
        acc[row.gene] = (acc[row.gene] || 0) + row.repeatCount;
        return acc;
    }, {} as Record<string, number>);

    const sortedGeneSums = Object.entries(geneRepeatSums)
        .sort(([, countA], [, countB]) => countB - countA); // Sort descending by count

    const topGenes = sortedGeneSums.slice(0, 5).map(([name, count]) => ({
        name,
        count,
        percentage: parseFloat(((count / totalRepeatCount) * 100).toFixed(1)) || 0
    }));

    const stats: ProcessedPlotStats = {
        total_occurrences: totalOccurrences,
        total_unique_motifs: uniqueMotifs.length,
        total_unique_genes: uniqueGenes.length,
        total_repeat_count: totalRepeatCount,
        top_genes: topGenes,
    };
    // --- End Stats ---

    // Prepare data for ECharts stacked horizontal bar chart series (one series per gene)
    const seriesData = uniqueGenes.map(gene => {
        // Data for each series needs to map to the y-axis categories (occurrence indices)
        const geneData = df_proc.map(row => {
            // If the row's gene matches the current series' gene, use the repeatCount, otherwise 0 for stacking
            return row.gene === gene ? row.repeatCount : 0;
        });

        return {
            name: gene,
            type: 'bar',
            stack: 'total', // Key for stacking
            data: geneData, // Array of repeat counts corresponding to each y-axis category (occurrence index)
            emphasis: { focus: 'series' },
            // Add hover data (motif name) - ECharts doesn't directly support hover_name like Plotly Express
            // We'll handle this in the tooltip formatter using the dataIndex
        };
    });


    // Y-axis labels (motifs corresponding to occurrence index) - still needed for axis
    const yAxisLabels = df_proc.map(row => row.motif);

    return {
        chartData: { series: seriesData, yLabels: yAxisLabels },
        stats
    };

  }, [queryData]); // Dependency: re-run when queryData changes

  // --- Fullscreen Logic ---
  const chartId = "hotspot-plot-chart"; // Unique ID
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
        const chartHeight = stats ? Math.max(600, stats.total_occurrences * 10 + 150) : 600;
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
  }, [chartId, processedData]); // Depend on processedData for height calc
  // --- End Fullscreen Logic ---

  // --- Render Logic ---

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-lg flex items-center">
            <Flame className="mr-2 h-5 w-5" />
            Motif Repeat Count by Gene (Hotspots)
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
    const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed for Hotspot Plot.';
    return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <Flame className="mr-2 h-5 w-5" />
             Motif Repeat Count by Gene (Hotspots)
           </CardTitle>
            {/* Optionally add disabled buttons */}
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
      text: 'Motif Repeat Count by Gene (Hotspots)',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'axis', // Trigger tooltip on axis hover for stacked bars
      axisPointer: { type: 'shadow' },
      formatter: (params: any[]) => { // Tooltip for stacked bar on axis trigger
        if (!Array.isArray(params) || params.length === 0) return '';

        const yIndex = params[0].dataIndex; // Index corresponding to the y-axis category
        const motifName = chartData.yLabels[yIndex] || 'Unknown Motif'; // Get motif from yLabels
        let tooltip = `<b>Motif: ${motifName}</b> (Occurrence ${yIndex})<br/>`;
        let total = 0;
        params.forEach((param: any) => {
            // For bar charts, param.value is the value for that specific bar segment
            if (param.value > 0) {
                 tooltip += `${param.marker} ${param.seriesName}: ${param.value.toLocaleString()}<br/>`;
                 total += param.value;
            }
        });
        tooltip += `<b>Total Repeats: ${total.toLocaleString()}</b>`;
        return tooltip;
       }
     },
     legend: {
       data: chartData.series.map(s => s.name),
       orient: 'vertical',
       right: 10,
       top: 'center',
       type: 'scroll',
       textStyle: { fontSize: 10 }
     },
     grid: {
         left: '10%', // Increased left margin for Y axis name
         right: '15%', // Keep space for legend/toolbox
         top: '12%', // Adjust top margin for title/legend
         bottom: '15%', // Keep space for dataZoom
         containLabel: true
     },
     xAxis: {
      type: 'value',
      name: 'Total Repeat Count',
      nameLocation: 'middle',
      nameGap: 30, // Adjusted gap
      axisLabel: { fontSize: 10 },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      splitLine: { lineStyle: { color: '#eef0f2' } },
    },
    yAxis: {
      type: 'category',
      name: 'Motif Occurrence',
      nameLocation: 'middle',
      nameGap: 95, // Increased gap slightly for long motif names
      data: chartData.yLabels,
      axisLabel: {
          fontSize: 9,
          interval: 0,
          // Consider adding a formatter to truncate long motif names if needed
          // formatter: (value: string) => value.length > 20 ? value.substring(0, 17) + '...' : value
      },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      axisTick: { show: false },
      splitLine: { show: false },
      inverse: true
    },
    series: chartData.series,
     toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right', // Changed from left: 'right'
        top: 'top', // Changed from top: 'bottom'
        feature: {
            mark: { show: true },
            dataZoom: { yAxisIndex: 0, title: { zoom: 'Zoom Y', back: 'Restore Y Zoom' } },
            dataView: { show: true, readOnly: false, title: 'Data View' },
            magicType: { show: true, type: ['stack', 'tiled'], title: {stack: 'Stack', tiled: 'Tile'} },
            restore: { show: true, title: 'Restore' },
            saveAsImage: { show: true, title: 'Save Image' }
        }
    },
    dataZoom: [
        {
            type: 'slider',
            yAxisIndex: 0,
            filterMode: 'filter',
            start: 0,
            end: 100,
            width: 15, // Slightly thinner slider
            right: 120, // Position closer to the chart, adjusted for toolbox
            bottom: 10,
            top: 'center', // Align vertically in the middle
            handleSize: '80%', // Make handle easier to grab
            showDataShadow: false, // Cleaner look
            borderColor: '#ddd',
        },
        {
            type: 'inside',
            yAxisIndex: 0,
            filterMode: 'filter',
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: false,
        },
        // Optional: Add dataZoom for x-axis if needed, though less common for this type
        // { type: 'inside', xAxisIndex: 0, filterMode: 'filter' },
        // { type: 'slider', xAxisIndex: 0, filterMode: 'filter', bottom: 10, height: 15 },
     ],
  };

  // Dynamically adjust height - reduced multiplier
  const chartHeight = Math.max(600, stats.total_occurrences * 8 + 150); // Reduced multiplier from 10 to 8

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="text-lg flex items-center">
           <Flame className="mr-2 h-5 w-5" />
           Motif Repeat Count by Gene (Hotspots)
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
                     <span className="text-muted-foreground">Total Occurrences:</span>
                     <Badge variant="secondary">{stats.total_occurrences.toLocaleString()}</Badge>
                  </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Unique Motifs:</span>
                     <Badge variant="secondary">{stats.total_unique_motifs.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Unique Genes:</span>
                     <Badge variant="secondary">{stats.total_unique_genes.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Total Repeat Count:</span>
                     <Badge variant="secondary">{stats.total_repeat_count.toLocaleString()}</Badge>
                  </div>
                  <Separator className="my-3" /> {/* Use Separator */}
                  <p className="font-medium text-muted-foreground">Top 5 Genes (by Repeats):</p>
                  {stats.top_genes.length > 0 ? stats.top_genes.map((geneStat) => (
                     <div key={geneStat.name} className="flex justify-between items-center">
                        <span className="truncate pr-2" title={geneStat.name}>{geneStat.name}:</span>
                        <Badge variant="outline" className="font-mono flex-shrink-0">
                           {geneStat.count.toLocaleString()} ({geneStat.percentage}%)
                        </Badge>
                     </div>
                  )) : (
                    <p className="text-muted-foreground italic">N/A</p>
                  )}
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
        {/* Chart Area takes full width */}
        {/* Add ID to the chart container div */}
        <div id={chartId} className="relative">
          <ReactECharts
            option={options}
            style={{ height: `${chartHeight}px`, width: '100%' }} // Dynamic height
            notMerge={true}
            lazyUpdate={true}
            theme={"light"}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default HotspotPlot;
