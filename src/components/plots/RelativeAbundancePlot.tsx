import React, { useMemo, useEffect } from 'react'; // Added useEffect
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query'; // Import UseQueryResult
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Removed CardDescription, CardFooter
import { AlertCircle, BarChartHorizontalBig, Info, Loader2, Maximize2 } from 'lucide-react'; // Added Maximize2 icon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added Button
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Type for the data structure expected from the query result
interface PlotSourceDataRow {
  category?: string | null;
  genomeID?: string | null;
  length_of_motif?: number | string | null;
  length_genome?: number | string | null;
  // Add other potential fields if needed for processing
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string; // Or a more specific type if needed
    data: PlotSourceDataRow[] | null;
    error?: string;
};

// Define the structure for chart-specific data processed internally
interface ProcessedChartData {
  categories: string[];
  series: {
    name: string;
    type: string;
    stack: string;
    emphasis: { focus: string };
    data: number[];
    label: { show: boolean; position: string; formatter: string };
  }[];
  legendData: string[];
}

// Define the structure for the calculated statistics processed internally
interface ProcessedPlotStats {
    total_categories: number;
    total_unique_genomes: number;
    avg_genome_length_mb: number;
    total_normalized_motifs: number;
    norm_motifs_by_type: {
        name: string;
        total: number;
        percentage: number;
    }[];
}

// Props now accept the raw query result
interface RelativeAbundancePlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>; // Use the specific query result type
}

// Wrap component with React.memo
const RelativeAbundancePlot: React.FC<RelativeAbundancePlotProps> = React.memo(({ queryResult }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    if (!queryData?.data || !Array.isArray(queryData.data) || queryData.data.length === 0) {
      return null; // No data to process
    }

    const rawData = queryData.data as PlotSourceDataRow[];

    // --- Start of processing logic (moved from index.tsx) ---
    const df_proc = rawData
      .map(row => ({
        category: String(row.category ?? 'Unknown'),
        genomeID: String(row.genomeID ?? 'Unknown'),
        length_of_motif: parseInt(String(row.length_of_motif ?? 0), 10),
        length_genome: parseFloat(String(row.length_genome ?? 0)),
      }))
      .filter(row => !isNaN(row.length_of_motif) && row.length_of_motif > 0 && !isNaN(row.length_genome) && row.length_genome > 0);

    if (df_proc.length === 0) return null;

    const totalLength = df_proc.reduce((sum, row) => sum + row.length_genome, 0);
    const avg_genome_length_mb = df_proc.length > 0 ? (totalLength / df_proc.length) / 1e6 : 1;

    const unique_genomes = new Set(df_proc.map(row => row.genomeID));
    const total_unique_genomes = unique_genomes.size;

    const genomes_per_category = df_proc.reduce((acc, row) => {
      acc[row.category] = acc[row.category] || new Set();
      acc[row.category].add(row.genomeID);
      return acc;
    }, {} as Record<string, Set<string>>);
    const categoryGenomeCounts = Object.fromEntries(
      Object.entries(genomes_per_category).map(([cat, genomes]) => [cat, genomes.size])
    );

    const motif_counts = df_proc.reduce((acc, row) => {
      const cat = row.category;
      const len = row.length_of_motif;
      acc[cat] = acc[cat] || {};
      acc[cat][len] = (acc[cat][len] || 0) + 1;
      return acc;
    }, {} as Record<string, Record<number, number>>);

    const sorted_categories = Object.keys(motif_counts).sort();
    const all_motif_lengths = [...new Set(df_proc.map(r => r.length_of_motif))].sort((a, b) => a - b);

    const motif_type_names: Record<number, string> = {
      1: 'Monomer', 2: 'Dimer', 3: 'Trimer',
      4: 'Tetramer', 5: 'Pentamer', 6: 'Hexamer'
    };

    const seriesData = all_motif_lengths.map(length => {
      const series_name = motif_type_names[length] || `Length ${length}`;
      const data = sorted_categories.map(category => {
        const count = motif_counts[category]?.[length] || 0;
        const num_genomes = categoryGenomeCounts[category] || 0;
        const norm_value = (num_genomes > 0 && avg_genome_length_mb > 0)
          ? count / avg_genome_length_mb / num_genomes
          : 0;
        // Round to nearest integer
        return Math.round(norm_value);
      });
      return {
        name: series_name,
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        data: data,
        label: { show: false, position: 'inside', formatter: '{c}' }
      };
    });
    // --- End of processing logic ---

    // --- Calculate Summary Statistics ---
    const total_normalized_motifs = seriesData.reduce((sum, series) => sum + series.data.reduce((s, val) => s + val, 0), 0);

    const stats: ProcessedPlotStats = {
        total_categories: sorted_categories.length,
        total_unique_genomes: total_unique_genomes,
        avg_genome_length_mb: parseFloat(avg_genome_length_mb.toFixed(2)),
        total_normalized_motifs: Math.round(total_normalized_motifs),
        norm_motifs_by_type: seriesData.map(series => {
            const total_for_type = series.data.reduce((s, val) => s + val, 0);
            const percentage = total_normalized_motifs > 0 ? (total_for_type / total_normalized_motifs) * 100 : 0;
            return {
                name: series.name,
                total: Math.round(total_for_type),
                percentage: parseFloat(percentage.toFixed(1))
            };
        })
    };
    // --- End of Stats Calculation ---

    const chartData: ProcessedChartData = {
       categories: sorted_categories,
       series: seriesData,
       legendData: seriesData.map(s => s.name),
    };

    return { chartData, stats };

  }, [queryData]); // Dependency: re-run when queryData changes

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    const chartDiv = document.getElementById('relative-abundance-chart');
    if (chartDiv) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        chartDiv.requestFullscreen();
      }
    }
  };

  // Add fullscreen change listener to update chart size
  useEffect(() => {
    const handleFullscreenChange = () => {
      const chartDiv = document.getElementById('relative-abundance-chart');
      if (chartDiv && document.fullscreenElement === chartDiv) {
        // If in fullscreen, adjust chart container styles
        chartDiv.style.height = '100vh';
        chartDiv.style.padding = '20px';
        chartDiv.style.background = '#ffffff';
      } else if (chartDiv) {
        // Reset styles when exiting fullscreen
        chartDiv.style.height = 'auto';
        chartDiv.style.padding = '0';
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-lg flex items-center">
             <BarChartHorizontalBig className="mr-2 h-5 w-5" />
             Relative Abundance Plot
          </CardTitle>
           <div className="flex items-center gap-2">
             <Skeleton className="h-8 w-24" />
             <Skeleton className="h-8 w-28" />
           </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <Skeleton className="h-[400px] w-full" />
           <Skeleton className="h-8 w-1/2" />
           <Skeleton className="h-6 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !processedData) {
    const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed.';
    return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <BarChartHorizontalBig className="mr-2 h-5 w-5" />
             Relative Abundance Plot
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

  // ECharts options configuration based on the processed data
  const options = {
    title: {
      text: 'Relative Abundance of SSR Motifs',
      subtext: 'Normalized per Mb per Genome',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      subtextStyle: {
         fontSize: 12,
         color: '#666'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow' // 'shadow' as default; can also be 'line' or 'none'
      },
      formatter: (params: any[]) => {
         // Custom tooltip formatter
         let tooltip = `<b>${params[0].name}</b><br/>`; // Category name
         params.forEach(param => {
             tooltip += `${param.marker} ${param.seriesName}: ${Math.round(param.value)}<br/>`;
         });
         return tooltip;
      }
    },
    legend: {
      data: chartData.legendData, // Use processed chartData
      orient: 'vertical',
      right: 10, // Position legend to the right
      top: 'center', // Center vertically
      // type: 'scroll', // Enable scroll if many legend items
    },
    grid: {
      left: '4%',  // Increased from 3%
      right: '16%', // Increased from 15%
      bottom: '4%', // Increased from 3%
      top: '15%',   // Added top margin
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'Normalized Count (per Mb/Genome)',
      nameLocation: 'middle',
      nameGap: 30, // Adjusted for better spacing
      axisLabel: {
         formatter: '{value}' // Integer formatting
      },
      minInterval: 1 // Force integer ticks
    },
    yAxis: {
      type: 'category',
      data: chartData.categories, // Use processed chartData
      name: 'Category',
      nameLocation: 'middle',
      nameGap: 80, // Adjust based on longest category name
      axisLabel: {
         interval: 0, // Show all labels
         rotate: 0 // Keep labels horizontal
      }
    },
    series: chartData.series, // Use processed chartData
    // Optional: Add toolbox for saving image, zooming etc.
    toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'top',
        feature: {
            mark: { show: true },
            dataView: { show: true, readOnly: false, title: 'Data View' },
            magicType: { show: true, type: ['line', 'bar', 'stack'], title: {line: 'Line', bar: 'Bar', stack: 'Stack'} },
            restore: { show: true, title: 'Restore' },
            dataZoom: { show: true, title: { zoom: 'Zoom', back: 'Restore Zoom' } },
            saveAsImage: { 
                show: true, 
                title: 'Save Image',
                pixelRatio: 6, // Increases export resolution (not actual DPI metadata)
                name: 'relative_abundance_plot',
                connectedBackgroundColor: '#fff',
                excludeComponents: ['toolbox'],
                type: 'png'
            }
        }
    },
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="text-lg flex items-center">
           <BarChartHorizontalBig className="mr-2 h-5 w-5" />
           Relative Abundance Plot
        </CardTitle>
        <div className="flex items-center gap-2">
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
                   <span className="text-muted-foreground">Total Categories:</span>
                   <Badge variant="secondary">{stats.total_categories.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Total Genomes:</span>
                   <Badge variant="secondary">{stats.total_unique_genomes.toLocaleString()}</Badge>
                </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Avg. Genome Size:</span>
                   <Badge variant="secondary">{stats.avg_genome_length_mb.toFixed(2)} Mb</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Total Norm. Motifs:</span>
                   <Badge variant="secondary">{stats.total_normalized_motifs}</Badge>
                </div>
                <Separator className="my-3" />
                <p className="font-medium text-muted-foreground">Normalized Motifs by Type:</p>
                {stats.norm_motifs_by_type.map((motifStat: { name: string; total: number; percentage: number }) => (
                   <div key={motifStat.name} className="flex justify-between items-center">
                      <span>{motifStat.name}:</span>
                      <Badge variant="outline" className="font-mono">
                         {motifStat.total} ({motifStat.percentage}%)
                      </Badge>
                   </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
            <span className="ml-2">Fullscreen</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div id="relative-abundance-chart" className="relative">
          <ReactECharts
            option={options}
            style={{
              height: '700px',
              width: '100%'
            }}
            notMerge={true}
            lazyUpdate={true}
            theme={"light"}
          />
        </div>
      </CardContent>
    </Card>
  );
});

export default RelativeAbundancePlot;
