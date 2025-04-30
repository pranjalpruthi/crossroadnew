import React, { useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, ScatterChart, Loader2, Clock, Maximize2 } from 'lucide-react'; // Added Maximize2
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import * as echarts from 'echarts/core';
import { ScatterChart as EScatterChart, LineChart } from 'echarts/charts';
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
    EScatterChart,
    LineChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent,
    DataZoomComponent
]);

// Type for the data structure expected from the query result (hssr_data)
interface HssrDataRow {
  motif?: string | null;
  year?: number | string | null;
  length_of_ssr?: number | string | null;
  gene?: string | null;
  genomeID?: string | null;
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string; // Should be 'hssr_data'
    data: HssrDataRow[] | null;
    error?: string;
};

// Define the structure for data points used in the chart
interface PlotPointData {
    year: number;
    length_of_ssr: number;
    motif: string;
    gene: string;
    genomeID: string;
}

// Define the structure for the calculated statistics processed internally
interface ProcessedPlotStats {
    total_data_points: number;
    unique_motifs: number;
    unique_genes: number;
    unique_genomes: number;
    year_range_min: number;
    year_range_max: number;
    ssr_length_min: number;
    ssr_length_max: number;
    average_ssr_length: number;
}

// Props now accept the raw query result
interface TemporalFacetedScatterPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

const TemporalFacetedScatterPlot: React.FC<TemporalFacetedScatterPlotProps> = ({ queryResult }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    if (!queryData?.data || !Array.isArray(queryData.data) || queryData.data.length === 0) {
      return null;
    }

    const rawData = queryData.data as HssrDataRow[];

    // --- Start of processing logic (adapted from Python) ---
    const df_proc: PlotPointData[] = rawData
        .map(row => ({
            // Perform type conversion and handle potential nulls/NaNs
            motif: String(row.motif ?? 'N/A'),
            year: Number(row.year),
            length_of_ssr: Number(row.length_of_ssr),
            gene: String(row.gene ?? 'N/A'),
            genomeID: String(row.genomeID ?? 'N/A'),
        }))
        .filter(row =>
            !isNaN(row.year) && row.year > 0 && // Ensure year is valid number > 0
            !isNaN(row.length_of_ssr) // Ensure length is valid number
        );

    if (df_proc.length === 0) return null;

    const uniqueMotifs = [...new Set(df_proc.map(r => r.motif))].sort();
    const uniqueGenes = [...new Set(df_proc.map(r => r.gene))];
    const uniqueGenomes = [...new Set(df_proc.map(r => r.genomeID))];
    const years = df_proc.map(r => r.year);
    const lengths = df_proc.map(r => r.length_of_ssr);

    // --- End of processing logic ---

    // --- Calculate Stats ---
    const stats: ProcessedPlotStats = {
        total_data_points: df_proc.length,
        unique_motifs: uniqueMotifs.length,
        unique_genes: uniqueGenes.length,
        unique_genomes: uniqueGenomes.length,
        year_range_min: Math.min(...years),
        year_range_max: Math.max(...years),
        ssr_length_min: Math.min(...lengths),
        ssr_length_max: Math.max(...lengths),
        average_ssr_length: parseFloat((lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1)) || 0,
     };
     // --- End Stats ---
 
     // Group data by gene for faceting
     const dataByGene = df_proc.reduce((acc, row) => {
         const gene = row.gene;
         if (!acc[gene]) {
             acc[gene] = [];
         }
         acc[gene].push(row);
         return acc;
     }, {} as Record<string, PlotPointData[]>);
 
     // Get sorted list of genes for consistent rendering order
     const sortedGenes = Object.keys(dataByGene).sort();
 
     return {
         dataByGene, // Pass grouped data
         sortedGenes, // Pass sorted gene names
         stats
     };
 
   }, [queryData]); // Dependency: re-run when queryData changes
 
   // --- Fullscreen Logic (Targets the container of all facets) ---
   const chartContainerId = "temporal-faceted-scatter-plot-container"; // ID for the outer container
   const toggleFullscreen = () => {
     const containerDiv = document.getElementById(chartContainerId);
     if (containerDiv) {
       if (document.fullscreenElement) {
         document.exitFullscreen();
       } else {
         containerDiv.requestFullscreen();
       }
     }
   };

   useEffect(() => {
     const handleFullscreenChange = () => {
       const containerDiv = document.getElementById(chartContainerId);
       if (containerDiv && document.fullscreenElement === containerDiv) {
         containerDiv.style.height = '100vh';
         containerDiv.style.overflowY = 'auto'; // Allow scrolling in fullscreen
         containerDiv.style.padding = '20px';
         containerDiv.style.background = '#ffffff';
         // Resize all chart instances within the container
         containerDiv.querySelectorAll('.echarts-for-react').forEach(chartElement => {
             const chartInstance = echarts.getInstanceByDom(chartElement as HTMLElement);
             chartInstance?.resize();
         });
       } else if (containerDiv) {
         containerDiv.style.height = 'auto';
         containerDiv.style.overflowY = 'visible';
         containerDiv.style.padding = '0';
          // Resize charts back
          containerDiv.querySelectorAll('.echarts-for-react').forEach(chartElement => {
             const chartInstance = echarts.getInstanceByDom(chartElement as HTMLElement);
             chartInstance?.resize();
         });
       }
     };

     document.addEventListener('fullscreenchange', handleFullscreenChange);
     return () => {
       document.removeEventListener('fullscreenchange', handleFullscreenChange);
     };
   }, [chartContainerId]);
   // --- End Fullscreen Logic ---
 
   // --- Render Logic ---
 
   if (isLoading) {
     return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between space-x-2">
           <CardTitle className="text-lg flex items-center">
             <Clock className="mr-2 h-5 w-5" />
             Temporal SSR Distribution by Gene
           </CardTitle>
            {/* Placeholder for buttons */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" /> {/* Stats button */}
              <Skeleton className="h-8 w-28" /> {/* Fullscreen button */}
            </div>
         </CardHeader>
         <CardContent className="space-y-4">
            {/* Show multiple skeletons for faceted view */}
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-3/4" />
         </CardContent>
       </Card>
     );
   }
 
   if (isError || !processedData) {
     const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed for Temporal SSR Distribution.';
     return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Temporal SSR Distribution by Gene
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
   const { dataByGene, sortedGenes, stats } = processedData;
 
   // Function to generate options for a single gene's chart
   const getGeneChartOptions = (geneName: string, geneData: PlotPointData[]) => {
     const uniqueMotifsInGene = [...new Set(geneData.map(r => r.motif))].sort();
     const seriesData = uniqueMotifsInGene.map(motif => ({
         name: motif,
         type: 'scatter',
         data: geneData
             .filter(row => row.motif === motif)
             .map(row => [row.year, row.length_of_ssr, row.gene, row.genomeID]), // Keep gene/genomeID for tooltip
         symbolSize: 8,
         emphasis: { focus: 'series' }
     }));
 
     // Calculate axis ranges specific to this gene's data
     const yearsInGene = geneData.map(r => r.year);
     const lengthsInGene = geneData.map(r => r.length_of_ssr);
     const minYear = Math.min(...yearsInGene);
     const maxYear = Math.max(...yearsInGene);
     const minLength = Math.min(...lengthsInGene);
     const maxLength = Math.max(...lengthsInGene);
     const yearPadding = maxYear > minYear ? Math.max(1, (maxYear - minYear) * 0.05) : 1;
     const lengthPadding = maxLength > minLength ? Math.max(1, (maxLength - minLength) * 0.05) : 1;
 
     return {
         title: {
             text: `Gene: ${geneName}`, // Title specific to the gene
             left: 'center',
             top: 10,
             textStyle: { fontSize: 14, fontWeight: 'normal' },
         },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        // params.data should be [year, length_of_ssr, gene, genomeID]
        // params.seriesName is the motif
        if (params.data && params.data.length >= 4) {
          return `<b>Motif: ${params.seriesName}</b><br/>` +
                 `Year: ${params.data[0]}<br/>` +
                 `SSR Length: ${params.data[1]}<br/>` +
                 `Gene: ${params.data[2]}<br/>` +
                 `Genome ID: ${params.data[3]}`;
        }
        return '';
      }
    },
         legend: {
             data: seriesData.map(s => s.name),
             orient: 'vertical',
             right: 5, // Adjust position slightly
             top: 'middle',
             type: 'scroll',
             textStyle: { fontSize: 9 } // Smaller legend text
         },
         grid: {
             left: '10%',
             right: '18%', // Keep space for legend/toolbox
             top: '15%', // Add top margin for title
             bottom: '20%', // Add bottom margin for dataZoom
             containLabel: true
         },
         xAxis: {
             type: 'value',
             name: 'Year',
             nameLocation: 'middle',
             nameGap: 25,
             min: Math.floor(minYear - yearPadding),
             max: Math.ceil(maxYear + yearPadding),
             axisLabel: { fontSize: 9, formatter: '{value}' },
             axisLine: { show: true, lineStyle: { color: 'black' } },
             splitLine: { lineStyle: { color: '#eee' } },
         },
         yAxis: {
             type: 'value',
             name: 'SSR Length',
             nameLocation: 'middle',
             nameGap: 35,
             min: Math.max(0, Math.floor(minLength - lengthPadding)),
             max: Math.ceil(maxLength + lengthPadding),
             axisLabel: { fontSize: 9 },
             axisLine: { show: true, lineStyle: { color: 'black' } },
             splitLine: { lineStyle: { color: '#eee' } },
         },
         series: seriesData,
         toolbox: { // Simplified toolbox per chart
             show: true,
             orient: 'vertical',
             right: 5,
             top: 10,
             itemSize: 12,
             feature: {
                 dataZoom: { yAxisIndex: 'none', title: { zoom: 'Zoom', back: 'Restore' } },
                 restore: { show: true, title: 'Restore' },
                 saveAsImage: { show: true, title: 'Save Image' }
             }
         },
         dataZoom: [
             {
                 type: 'slider', // Slider for x-axis (Year)
                 xAxisIndex: 0,
                 filterMode: 'filter',
                 start: 0,
                 end: 100,
                 height: 15,
                 bottom: 5, // Position closer to bottom
             },
             {
                 type: 'slider',
                 yAxisIndex: 0,
                 filterMode: 'filter',
                 start: 0,
                 end: 100,
                 width: 15,
                 right: 5, // Position closer to right
             },
             {
            type: 'inside', // Inside zoom/pan for both axes
            xAxisIndex: 0,
            filterMode: 'filter',
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: false,
        },
        {
            type: 'inside',
            yAxisIndex: 0,
            filterMode: 'filter',
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
                 moveOnMouseWheel: false,
             }
         ],
     };
   }
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-lg flex items-center">
             <Clock className="mr-2 h-5 w-5" />
             Temporal SSR Distribution by Gene
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
                  <p className="font-medium text-sm mb-2 text-center">Overall Summary</p>
                  <Separator className="mb-3" />
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Points:</span>
                      <Badge variant="secondary">{stats.total_data_points.toLocaleString()}</Badge>
                   </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unique Motifs:</span>
                      <Badge variant="secondary">{stats.unique_motifs.toLocaleString()}</Badge>
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
                      <span className="text-muted-foreground">Year Range:</span>
                      <Badge variant="outline">{stats.year_range_min} - {stats.year_range_max}</Badge>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">SSR Length Range:</span>
                      <Badge variant="outline">{stats.ssr_length_min} - {stats.ssr_length_max}</Badge>
                   </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. SSR Length:</span>
                      <Badge variant="outline">{stats.average_ssr_length}</Badge>
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
       {/* Add ID to the container of all facets */}
       <CardContent id={chartContainerId} className="p-4 space-y-6">
          {/* Removed grid layout */}
          {/* Chart Area - Render multiple charts */}
          {sortedGenes.map(geneName => (
              <div key={geneName} className="border rounded-md p-2 shadow-sm">
                  <ReactECharts
                      className="echarts-for-react" // Add class for easy selection
                      option={getGeneChartOptions(geneName, dataByGene[geneName])}
                      style={{ height: '350px', width: '100%' }}
                      notMerge={true}
                      lazyUpdate={true}
                      theme={"light"}
                  />
              </div>
          ))}
          {/* Removed the stats column div */}
       </CardContent>
     </Card>
   );
};

export default TemporalFacetedScatterPlot;
