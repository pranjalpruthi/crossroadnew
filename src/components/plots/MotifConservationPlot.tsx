import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, PieChart, Loader2 } from 'lucide-react'; // Using PieChart icon
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
  motif?: string | null;
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
    total_unique_motifs: number;
    conserved_motifs_count: number;
    conserved_motifs_percent: number;
    shared_motifs_count: number;
    shared_motifs_percent: number;
    unique_motifs_count: number;
    unique_motifs_percent: number;
}

// Props now accept the raw query result (expected to be plot_source)
interface MotifConservationPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

const MotifConservationPlot: React.FC<MotifConservationPlotProps> = ({ queryResult }) => {
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
            row.motif !== null && row.motif !== undefined && row.motif !== ''
        )
        .map(row => ({
            genomeID: String(row.genomeID!),
            motif: String(row.motif!),
        }));

    if (df_proc.length === 0) return null;

    const total_unique_genomes = new Set(df_proc.map(r => r.genomeID)).size;
    if (total_unique_genomes === 0) return null; // Cannot calculate conservation without genomes

    // Calculate genome count per motif
    const motifGenomeCounts = df_proc.reduce((acc, row) => {
        acc[row.motif] = acc[row.motif] || new Set<string>();
        acc[row.motif].add(row.genomeID);
        return acc;
    }, {} as Record<string, Set<string>>);

    const motifCounts = Object.entries(motifGenomeCounts).map(([motif, genomes]) => ({
        motif,
        count: genomes.size
    }));

    let conserved_motif_count = 0;
    let shared_motif_count = 0;
    let unique_motif_count = 0;

    for (const item of motifCounts) {
        if (item.count === total_unique_genomes) {
            conserved_motif_count++;
        } else if (item.count > 1) {
            shared_motif_count++;
        } else { // count === 1
            unique_motif_count++;
        }
    }

    const total_motifs = motifCounts.length;
    if (total_motifs === 0) return null; // No motifs found

    const conserved_percent = (conserved_motif_count / total_motifs) * 100;
    const shared_percent = (shared_motif_count / total_motifs) * 100;
    const unique_percent = (unique_motif_count / total_motifs) * 100;

    const pie_labels = ['Conserved', 'Shared', 'Unique'];
    const pie_values = [conserved_percent, shared_percent, unique_percent];
    const pie_counts = [conserved_motif_count, shared_motif_count, unique_motif_count];
    const pie_colors = ['#87CEEB', '#90EE90', '#F08080']; // SkyBlue, LightGreen, LightCoral (from Python)

    // --- End of processing logic ---

    // --- Calculate Stats ---
    const stats: ProcessedPlotStats = {
        total_unique_genomes: total_unique_genomes,
        total_unique_motifs: total_motifs,
        conserved_motifs_count: conserved_motif_count,
        conserved_motifs_percent: parseFloat(conserved_percent.toFixed(1)),
        shared_motifs_count: shared_motif_count,
        shared_motifs_percent: parseFloat(shared_percent.toFixed(1)),
        unique_motifs_count: unique_motif_count,
        unique_motifs_percent: parseFloat(unique_percent.toFixed(1)),
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
            <PieChart className="mr-2 h-5 w-5" />
            Motif Conservation Plot
          </CardTitle>
           {/* Placeholder for buttons */}
           <div className="flex items-center gap-2">
             <Skeleton className="h-8 w-24" /> {/* Placeholder for Stats button */}
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
    const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed for Motif Conservation.';
    return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <PieChart className="mr-2 h-5 w-5" />
             Motif Conservation Plot
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
      text: 'Distribution of Motif Categories by Conservation',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => { // Custom tooltip using custom data
        if (params.data && params.data.name && params.data.count !== undefined) {
          return `<b>${params.name}</b><br/>` +
                 `Percentage: ${params.percent?.toFixed(1)}%<br/>` + // Use ECharts built-in percent
                 `Motif Count: ${params.data.count.toLocaleString()}`;
        }
        return '';
      }
    },
    legend: {
      orient: 'vertical',
      left: 'right', // Position legend to the right
      top: 'center',
      data: chartData.pieData.map(item => item.name),
      textStyle: { fontSize: 11 }
    },
    series: [
      {
        name: 'Motif Conservation',
        type: 'pie',
        radius: '65%', // Adjust size as needed
        center: ['50%', '55%'], // Center the pie
        data: chartData.pieData, // Use processed data {value, name, count}
        label: {
            show: true,
            formatter: '{b}: {d}%', // Show name and percentage
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
            // Apply colors directly if needed, though ECharts cycles by default
            // color: (params: any) => chartData.colors[params.dataIndex % chartData.colors.length]
        },
        // Apply pull effect from Python code
        selectedMode: 'single',
        select: {
            itemStyle: {
                borderColor: '#333',
                borderWidth: 2,
            }
        },
        // Mimic 'pull' by slightly offsetting the 'Conserved' slice if needed
        // This is often better handled via emphasis or selection in ECharts
      }
    ],
    color: chartData.colors, // Assign palette
     toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'bottom', // Move toolbox lower
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
           <PieChart className="mr-2 h-5 w-5" />
           Motif Conservation Plot
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
                   <span className="text-muted-foreground">Total Motifs:</span>
                   <Badge variant="secondary">{stats.total_unique_motifs.toLocaleString()}</Badge>
                </div>
                <Separator className="my-3" /> {/* Use Separator */}
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Conserved:</span>
                   <Badge variant="outline" style={{backgroundColor: chartData.colors[0] + '33'}}>
                      {stats.conserved_motifs_count.toLocaleString()} ({stats.conserved_motifs_percent}%)
                   </Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Shared:</span>
                   <Badge variant="outline" style={{backgroundColor: chartData.colors[1] + '33'}}>
                      {stats.shared_motifs_count.toLocaleString()} ({stats.shared_motifs_percent}%)
                   </Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Unique:</span>
                   <Badge variant="outline" style={{backgroundColor: chartData.colors[2] + '33'}}>
                      {stats.unique_motifs_count.toLocaleString()} ({stats.unique_motifs_percent}%)
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
           style={{ height: '550px', width: '100%' }} // Adjusted height
           notMerge={true}
           lazyUpdate={true}
           theme={"light"}
         />
      </CardContent>
    </Card>
  );
};

export default MotifConservationPlot;
