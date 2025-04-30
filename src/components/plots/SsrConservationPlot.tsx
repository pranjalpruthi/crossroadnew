import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, PieChart, Loader2, Share2 } from 'lucide-react'; // Using Share2 icon for SSR conservation
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import * as echarts from 'echarts/core';
// Import Popover components
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button'; // Added Button
import { Separator } from '@/components/ui/separator'; // Added Separator

// Type for the data structure expected from the query result (plot_source)
interface PlotSourceDataRow {
  genomeID?: string | null;
  loci?: string | null; // Expecting 'loci' column
  // Other fields might exist but are not used by this plot
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string;
    data: PlotSourceDataRow[] | null;
    error?: string;
};

// Define the structure for chart-specific data processed internally
interface ProcessedPieChartData {
  pieData: { value: number; name: string; count: number }[]; // value=percentage, name=category, count=raw count
  colors: string[];
}

// Define the structure for the calculated statistics processed internally
interface ProcessedPlotStats {
    total_unique_genomes: number;
    total_unique_ssr: number; // Changed from motifs
    conserved_ssr_count: number;
    conserved_ssr_percent: number;
    shared_ssr_count: number;
    shared_ssr_percent: number;
    unique_ssr_count: number;
    unique_ssr_percent: number;
}

// Props now accept the raw query result (expected to be plot_source)
interface SsrConservationPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

const SsrConservationPlot: React.FC<SsrConservationPlotProps> = ({ queryResult }) => {
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
            row.loci !== null && row.loci !== undefined && row.loci !== '' // Use 'loci'
        )
        .map(row => ({
            genomeID: String(row.genomeID!),
            loci: String(row.loci!), // Use 'loci'
        }));

    if (df_proc.length === 0) return null;

    const total_unique_genomes = new Set(df_proc.map(r => r.genomeID)).size;
    if (total_unique_genomes === 0) return null; // Cannot calculate conservation without genomes

    // Calculate genome count per SSR locus
    const ssrLocusGenomeCounts = df_proc.reduce((acc, row) => {
        acc[row.loci] = acc[row.loci] || new Set<string>();
        acc[row.loci].add(row.genomeID);
        return acc;
    }, {} as Record<string, Set<string>>);

    const ssrCounts = Object.entries(ssrLocusGenomeCounts).map(([locus, genomes]) => ({
        locus,
        count: genomes.size
    }));

    let conserved_ssr_count = 0;
    let shared_ssr_count = 0;
    let unique_ssr_count = 0;

    for (const item of ssrCounts) {
        if (item.count === total_unique_genomes) {
            conserved_ssr_count++;
        } else if (item.count > 1) {
            shared_ssr_count++;
        } else { // count === 1
            unique_ssr_count++;
        }
    }

    const total_ssr = ssrCounts.length; // Total unique loci
    if (total_ssr === 0) return null; // No loci found

    const conserved_percent = (conserved_ssr_count / total_ssr) * 100;
    const shared_percent = (shared_ssr_count / total_ssr) * 100;
    const unique_percent = (unique_ssr_count / total_ssr) * 100;

    const pie_labels = ['Conserved', 'Shared', 'Unique'];
    const pie_values = [conserved_percent, shared_percent, unique_percent];
    const pie_counts = [conserved_ssr_count, shared_ssr_count, unique_ssr_count];
    const pie_colors = ['#87CEEB', '#90EE90', '#F08080']; // SkyBlue, LightGreen, LightCoral (from Python)

    // --- End of processing logic ---

    // --- Calculate Stats ---
    const stats: ProcessedPlotStats = {
        total_unique_genomes: total_unique_genomes,
        total_unique_ssr: total_ssr,
        conserved_ssr_count: conserved_ssr_count,
        conserved_ssr_percent: parseFloat(conserved_percent.toFixed(1)),
        shared_ssr_count: shared_ssr_count,
        shared_ssr_percent: parseFloat(shared_percent.toFixed(1)),
        unique_ssr_count: unique_ssr_count,
        unique_ssr_percent: parseFloat(unique_percent.toFixed(1)),
    };
    // --- End Stats ---

    const chartData: ProcessedPieChartData = {
       pieData: pie_labels.map((label, index) => ({
           name: label,
           value: parseFloat(pie_values[index].toFixed(2)), // Percentage for pie value
           count: pie_counts[index] // Raw count for custom data/tooltip
       })),
       colors: pie_colors,
    };

    return { chartData, stats };

  }, [queryData]); // Dependency: re-run when queryData changes

  // --- Render Logic ---

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-lg flex items-center">
            <Share2 className="mr-2 h-5 w-5" />
            SSR Conservation Plot
          </CardTitle>
           {/* Placeholder for buttons */}
           <div className="flex items-center gap-2">
             <Skeleton className="h-8 w-24" /> {/* Stats button */}
           </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <Skeleton className="h-[400px] w-full rounded-full" /> {/* Pie-like skeleton */}
           <Skeleton className="h-8 w-1/2" />
           <Skeleton className="h-6 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !processedData) {
    const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed for SSR Conservation.';
    return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <Share2 className="mr-2 h-5 w-5" />
             SSR Conservation Plot
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
      text: 'Distribution of SSRs by Conservation Level', // Updated title
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => { // Custom tooltip using custom data
        if (params.data && params.data.name && params.data.count !== undefined) {
          return `<b>${params.name} SSRs</b><br/>` + // Updated label
                 `Percentage: ${params.percent?.toFixed(1)}%<br/>` +
                 `SSR Count: ${params.data.count.toLocaleString()}`; // Updated label
        }
        return '';
      }
    },
    legend: {
      orient: 'vertical',
      left: 'right',
      top: 'center',
      data: chartData.pieData.map(item => item.name),
      textStyle: { fontSize: 11 }
    },
    series: [
      {
        name: 'SSR Conservation', // Updated name
        type: 'pie',
        radius: ['40%', '65%'], // Make it a donut chart like python example (hole=0.3)
        center: ['50%', '55%'],
        data: chartData.pieData,
        label: {
            show: true,
            formatter: '{b}: {d}%',
            fontSize: 11,
        },
        labelLine: {
            show: true,
            length: 8,
            length2: 8,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
            // color: (params: any) => chartData.colors[params.dataIndex % chartData.colors.length]
        },
        selectedMode: 'single',
        select: {
            itemStyle: {
                borderColor: '#333',
                borderWidth: 2,
            }
        },
      }
    ],
    color: chartData.colors,
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
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="text-lg flex items-center">
           <Share2 className="mr-2 h-5 w-5" />
           SSR Conservation Plot
        </CardTitle>
        {/* Stats Button in Popover */}
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
                     <span className="text-muted-foreground">Total Genomes:</span>
                     <Badge variant="secondary">{stats.total_unique_genomes.toLocaleString()}</Badge>
                  </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Total SSRs:</span> {/* Updated label */}
                     <Badge variant="secondary">{stats.total_unique_ssr.toLocaleString()}</Badge>
                  </div>
                  <Separator className="my-3" /> {/* Use Separator */}
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Conserved:</span>
                     <Badge variant="outline" style={{backgroundColor: chartData.colors[0] + '33'}}>
                        {stats.conserved_ssr_count.toLocaleString()} ({stats.conserved_ssr_percent}%)
                     </Badge>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Shared:</span>
                     <Badge variant="outline" style={{backgroundColor: chartData.colors[1] + '33'}}>
                        {stats.shared_ssr_count.toLocaleString()} ({stats.shared_ssr_percent}%)
                     </Badge>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Unique:</span>
                     <Badge variant="outline" style={{backgroundColor: chartData.colors[2] + '33'}}>
                        {stats.unique_ssr_count.toLocaleString()} ({stats.unique_ssr_percent}%)
                     </Badge>
                  </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      {/* Chart Area takes full width */}
      <CardContent className="p-4">
         <ReactECharts
           option={options}
           style={{ height: '550px', width: '100%' }}
           notMerge={true}
           lazyUpdate={true}
           theme={"light"}
         />
         {/* Removed the grid and stats column div */}
      </CardContent>
    </Card>
  );
};

export default SsrConservationPlot;
