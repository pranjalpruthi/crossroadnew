import React, { useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, BarChartBig, Maximize2 } from 'lucide-react'; // Added Maximize2
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
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
    GridComponent,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent,
    DataZoomComponent
]);

// Type for the data structure expected from the query result (ssr_gene_intersect)
interface SsrGeneIntersectDataRow {
  gene?: string | null;
  ssr_position?: string | null;
  // Other columns might exist but are not used here
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string; // Should be 'ssr_gene_intersect'
    data: SsrGeneIntersectDataRow[] | null;
    error?: string;
};



// Define the structure for the calculated statistics processed internally
interface ProcessedPlotStats {
    total_genes: number;
    total_motifs: number; // Total intersections counted
    position_counts: Record<string, number>; // Counts per position type
}

// Props now accept the raw query result
interface SsrGeneIntersectionPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

const SsrGeneIntersectionPlot: React.FC<SsrGeneIntersectionPlotProps> = ({ queryResult }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    if (!queryData?.data || !Array.isArray(queryData.data) || queryData.data.length === 0) {
      return null;
    }

    const rawData = queryData.data as SsrGeneIntersectDataRow[];

    // --- Start of processing logic (adapted from Python) ---
    const df_proc = rawData
        .filter(row =>
            row.gene !== null && row.gene !== undefined && row.gene !== '' &&
            row.ssr_position !== null && row.ssr_position !== undefined && row.ssr_position !== ''
        )
        .map(row => ({
            gene: String(row.gene!),
            ssr_position: String(row.ssr_position!),
        }));

    if (df_proc.length === 0) return null;

    // Aggregate counts per gene and ssr_position
    const positionCountsMap = df_proc.reduce((acc, row) => {
        const gene = row.gene;
        const pos = row.ssr_position;
        if (!acc[gene]) {
            acc[gene] = {};
        }
        acc[gene][pos] = (acc[gene][pos] || 0) + 1;
        return acc;
    }, {} as Record<string, Record<string, number>>);

    // Determine the order of positions and genes
    const allPositions = [...new Set(df_proc.map(r => r.ssr_position))];
    const preferredPositionOrder = ['IN', 'intersect_start', 'intersect_stop'];
    const availablePreferred = preferredPositionOrder.filter(p => allPositions.includes(p));
    const otherPositions = allPositions.filter(p => !preferredPositionOrder.includes(p)).sort();
    const finalPositionOrder = [...availablePreferred, ...otherPositions];

    const genes = Object.keys(positionCountsMap).sort(); // Sort genes alphabetically

    // Prepare data for ECharts series
    const seriesData = finalPositionOrder.map(position => ({
        name: position,
        type: 'bar',
        stack: 'total', // Stack bars
        emphasis: { focus: 'series' },
        data: genes.map(gene => positionCountsMap[gene]?.[position] || 0) // Get count for this gene/position, default 0
    }));

    // --- End of processing logic ---

    // --- Calculate Stats ---
    let total_motifs = 0;
    const position_totals: Record<string, number> = {};
    finalPositionOrder.forEach(pos => position_totals[pos] = 0);

    genes.forEach(gene => {
        finalPositionOrder.forEach(pos => {
            const count = positionCountsMap[gene]?.[pos] || 0;
            position_totals[pos] += count;
            total_motifs += count;
        });
    });

    const stats: ProcessedPlotStats = {
        total_genes: genes.length,
        total_motifs: total_motifs,
        position_counts: position_totals,
    };
    // --- End Stats ---

    return {
        chartData: { genes, series: seriesData, legendData: finalPositionOrder },
        stats
    };

  }, [queryData]); // Dependency: re-run when queryData changes

  // --- Fullscreen Logic ---
  const chartId = "ssr-gene-intersection-chart"; // Unique ID
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
        chartDiv.style.height = '600px'; // Reset to original fixed height
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
  }, [chartId]);
  // --- End Fullscreen Logic ---

  // --- Render Logic ---

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-lg flex items-center">
            <BarChartBig className="mr-2 h-5 w-5" />
            SSR Gene Intersection Plot
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
    const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed for SSR Gene Intersection.';
    return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <BarChartBig className="mr-2 h-5 w-5" />
             SSR Gene Intersection Plot
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
      text: 'Distribution of SSR Motifs by Gene and Position',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'axis', // Trigger tooltip on axis hover
      axisPointer: { type: 'shadow' }, // Use shadow to highlight bar stack
      formatter: (params: any[]) => { // Custom tooltip for stacked bars
        let tooltip = `<b>Gene: ${params[0].name}</b><br/>`;
        let sum = 0;
        params.forEach(param => {
            tooltip += `${param.marker} ${param.seriesName}: ${param.value.toLocaleString()}<br/>`;
            sum += param.value || 0;
        });
        tooltip += `<b>Total: ${sum.toLocaleString()}</b>`;
        return tooltip;
      }
    },
    legend: {
      data: chartData.legendData,
      top: 30, // Position legend below title
      type: 'scroll', // Allow scrolling if many positions
      textStyle: { fontSize: 11 }
    },
    grid: {
        left: '5%',
        right: '5%',
        bottom: '15%', // Increase bottom margin for dataZoom and labels
        containLabel: true
    },
    xAxis: {
      type: 'category',
      name: 'Gene',
      nameLocation: 'middle',
      nameGap: 65, // Adjust gap for rotated labels
      data: chartData.genes,
      axisLabel: {
          interval: 0, // Show all labels initially (dataZoom will handle overflow)
          rotate: -45,
          fontSize: 10,
      },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      axisTick: { show: true, alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      name: 'Count of SSR Motifs',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
          fontSize: 10,
          formatter: (value: number) => value.toLocaleString()
      },
      axisLine: { show: true, lineStyle: { color: 'black' } },
      splitLine: { lineStyle: { color: '#eef0f2' } },
    },
    series: chartData.series,
     toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
            mark: { show: true },
            dataZoom: { yAxisIndex: 'none', title: { zoom: 'Zoom', back: 'Restore Zoom' } }, // Add dataZoom to toolbox
            dataView: { show: true, readOnly: false, title: 'Data View' },
            magicType: { show: true, type: ['line', 'bar', 'stack'], title: {line: 'Line', bar: 'Bar', stack: 'Stack'} },
            restore: { show: true, title: 'Restore' },
            saveAsImage: { show: true, title: 'Save Image' }
        }
    },
    dataZoom: [
        {
            type: 'slider',
            xAxisIndex: 0,
            filterMode: 'filter',
            start: 0,
            // Dynamically set end based on number of genes, e.g., show first 50 or 100% if few
            end: chartData.genes.length > 50 ? (50 / chartData.genes.length) * 100 : 100,
            height: 20,
            bottom: 40,
        },
        {
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'filter',
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: false,
        }
     ],
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="text-lg flex items-center">
           <BarChartBig className="mr-2 h-5 w-5" />
           SSR Gene Intersection Plot
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
                     <span className="text-muted-foreground">Total Genes Analyzed:</span>
                     <Badge variant="secondary">{stats.total_genes.toLocaleString()}</Badge>
                  </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Total SSR Intersections:</span>
                     <Badge variant="secondary">{stats.total_motifs.toLocaleString()}</Badge>
                  </div>
                  <Separator className="my-3" /> {/* Use Separator */}
                  <p className="font-medium text-muted-foreground">Counts by Position:</p>
                  {Object.entries(stats.position_counts).map(([position, count]) => (
                     <div key={position} className="flex justify-between items-center">
                        <span>{position}:</span>
                        <Badge variant="outline" className="font-mono">
                           {count.toLocaleString()} ({stats.total_motifs > 0 ? ((count / stats.total_motifs) * 100).toFixed(1) : 0}%)
                        </Badge>
                     </div>
                  ))}
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
            style={{ height: '600px', width: '100%' }} // Keep fixed height
            notMerge={true}
            lazyUpdate={true}
            theme={"light"}
          />
        </div>
        {/* Removed the grid and stats column div */}
      </CardContent>
    </Card>
  );
};

export default SsrGeneIntersectionPlot;
