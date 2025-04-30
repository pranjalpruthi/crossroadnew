import React, { useMemo, useEffect } from 'react'; // Added useEffect
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query'; // Import UseQueryResult
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, GitBranch, Maximize2 } from 'lucide-react'; // Added Maximize2
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
  country?: string | null;
  genomeID?: string | null;
}

// Type for the structure returned by the queryFn in index.tsx
type QueryFnData = {
    plotKey: string;
    data: PlotSourceDataRow[] | null;
    error?: string;
};

// Define the structure for Sankey chart data processed internally
interface ProcessedSankeyChartData {
  nodes: { name: string }[];
  // Add sourceName and targetName to the link structure
  links: { source: number; target: number; value: number; sourceName: string; targetName: string }[];
}

// Define the structure for the calculated statistics processed internally
interface ProcessedSankeyStats {
    total_categories: number;
    total_countries: number;
    total_unique_genomes: number;
    total_links_shown: number;
    total_genome_flow: number;
}

// Props now accept the raw query result
interface CategoryCountrySankeyPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

// Helper function to generate HSL colors (similar to Python logic)
function getHslColor(index: number, total: number, saturation = 0.7, lightness = 0.6): string {
    const hue = (index / total) % 1.0;
    return `hsl(${Math.round(hue * 360)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`;
}

const CategoryCountrySankeyPlot: React.FC<CategoryCountrySankeyPlotProps> = ({ queryResult }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    if (!queryData?.data || !Array.isArray(queryData.data) || queryData.data.length === 0) {
      return null;
    }

    const rawData = queryData.data as PlotSourceDataRow[];

    // --- Start of processing logic (moved from index.tsx) ---
    // Access properties directly for type safety
    const df_proc = rawData
        .filter(row =>
            row.category !== null && row.category !== undefined &&
            row.country !== null && row.country !== undefined &&
            row.genomeID !== null && row.genomeID !== undefined
        )
        .map(row => ({
            // We know these are not null/undefined due to the filter above
            category: String(row.category!),
            country: String(row.country!),
            genomeID: String(row.genomeID),
        }));

    if (df_proc.length === 0) return null;

    // Aggregate link data
    const linkDataMap = df_proc.reduce((acc, row) => {
        const key = `${row.category}__${row.country}`;
        acc[key] = acc[key] || { category: row.category, country: row.country, genomes: new Set<string>() };
        acc[key].genomes.add(row.genomeID);
        return acc;
    }, {} as Record<string, { category: string; country: string; genomes: Set<string> }>);

    const links = Object.values(linkDataMap).map(item => ({
        source: item.category,
        target: item.country,
        value: item.genomes.size,
    })).filter(link => link.value > 0);

    if (links.length === 0) return null;

    // Prepare nodes
    const unique_categories = [...new Set(links.map(l => l.source))].sort();
    const unique_countries = [...new Set(links.map(l => l.target))].sort();
    const nodes = [...unique_categories, ...unique_countries];
    const nodeMap = Object.fromEntries(nodes.map((name, i) => [name, i]));

    // Map links to indices and include original names
    const mappedLinks = links.map(link => ({
        source: nodeMap[link.source], // Index of source node
        target: nodeMap[link.target], // Index of target node
        value: link.value,
        sourceName: link.source, // Original source name (category)
        targetName: link.target, // Original target name (country)
    }));

    // --- Calculate Stats ---
    const total_unique_genomes_in_data = new Set(df_proc.map(r => r.genomeID)).size;
    const total_flow = mappedLinks.reduce((sum, link) => sum + link.value, 0);
    const stats: ProcessedSankeyStats = {
        total_categories: unique_categories.length,
        total_countries: unique_countries.length,
        total_unique_genomes: total_unique_genomes_in_data,
        total_links_shown: mappedLinks.length,
        total_genome_flow: total_flow,
    };
    // --- End Stats ---

    const chartData: ProcessedSankeyChartData = {
        nodes: nodes.map(name => ({ name })),
        links: mappedLinks,
    };

    return { chartData, stats };

  }, [queryData]); // Dependency: re-run when queryData changes

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    const chartDiv = document.getElementById('category-country-sankey-chart');
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
      const chartDiv = document.getElementById('category-country-sankey-chart');
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
            <GitBranch className="mr-2 h-5 w-5" />
            Category → Country Sankey Plot
          </CardTitle>
           {/* Placeholder for buttons */}
           <div className="flex items-center gap-2">
             <Skeleton className="h-8 w-24" /> {/* Stats button */}
             <Skeleton className="h-8 w-28" /> {/* Fullscreen button */}
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

  if (isError || !processedData || processedData.chartData.nodes.length === 0 || processedData.chartData.links.length === 0) {
    const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed.';
    return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <GitBranch className="mr-2 h-5 w-5" />
             Category → Country Sankey Plot
           </CardTitle>
           {/* Optionally add disabled buttons here */}
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

  // Assign colors to nodes (Categories get HSL, Countries get default palette)
  const numCategories = stats.total_categories;
  const nodeColors = chartData.nodes.map((_node, index) => {
      if (index < numCategories) {
          // Category node
          return getHslColor(index, numCategories);
      } else {
          // Country node - use ECharts default palette cycling
          return undefined; // Let ECharts assign default color
      }
  });

  // Assign link colors based on source node color with alpha
  const linkColors = chartData.links.map(link => {
      const sourceNodeIndex = link.source;
      const sourceColor = nodeColors[sourceNodeIndex];
      if (sourceColor) {
          // Attempt to parse HSL and add alpha
          try {
              const match = sourceColor.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
              if (match) {
                  return `hsla(${match[1]}, ${match[2]}%, ${match[3]}%, 0.6)`; // Add alpha 0.6
              }
          } catch (e) { /* ignore parsing error, fallback below */ }
      }
      return 'rgba(204, 204, 204, 0.6)'; // Fallback grey
  });


  // ECharts options configuration
  const options = {
    title: {
      text: 'Genome Flow: Category → Country',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => {
        // Check if it's a link (edge) and has data with source/target names
        if (params.dataType === 'edge' && params.data && params.data.sourceName && params.data.targetName) {
          return `${params.data.sourceName} → ${params.data.targetName}: ${params.data.value.toLocaleString()} Genomes`;
        }
        // Check if it's a node
        if (params.dataType === 'node') {
           return `${params.name}`; // Show node name
        }
        return '';
      }
    },
    series: [
      {
        type: 'sankey',
        data: chartData.nodes.map((node, index) => ({ // Use processed chartData
            ...node,
            itemStyle: {
                color: nodeColors[index] // Assign specific color or let ECharts default
            }
        })),
        // Pass the full link object including sourceName and targetName
        links: chartData.links.map((link, index) => ({
            source: link.source, // Index
            target: link.target, // Index
            value: link.value,
            sourceName: link.sourceName, // Pass name for tooltip
            targetName: link.targetName, // Pass name for tooltip
            lineStyle: {
                color: linkColors[index] // Use calculated RGBA color
            }
        })),
        emphasis: {
          focus: 'adjacency'
        },
        lineStyle: {
          color: 'gradient', // Use gradient by default, overridden by specific link colors
          curveness: 0.5
        },
        label: {
            fontSize: 10,
            color: '#333'
        },
        nodeAlign: 'justify', // Align nodes vertically
        nodeGap: 12, // Gap between nodes
      }
    ],
    toolbox: { // Add toolbox like other plots
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'top',
      feature: {
          mark: { show: true },
          dataView: { show: true, readOnly: false, title: 'Data View' },
          restore: { show: true, title: 'Restore' },
          saveAsImage: { 
              show: true, 
              title: 'Save Image',
              pixelRatio: 6,
              name: 'category_country_sankey',
              connectedBackgroundColor: '#fff',
              excludeComponents: ['toolbox'],
              type: 'png'
          }
      }
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="text-lg flex items-center">
           <GitBranch className="mr-2 h-5 w-5" />
           Category → Country Sankey Plot
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
                   <span className="text-muted-foreground">Total Categories:</span>
                   <Badge variant="secondary">{stats.total_categories.toLocaleString()}</Badge>
                </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Total Countries:</span>
                   <Badge variant="secondary">{stats.total_countries.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Total Unique Genomes:</span>
                   <Badge variant="secondary">{stats.total_unique_genomes.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Links Shown:</span>
                   <Badge variant="secondary">{stats.total_links_shown.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Total Genome Flow:</span>
                   <Badge variant="secondary">{stats.total_genome_flow.toLocaleString()}</Badge>
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
        {/* Chart Area takes full width */}
        <div id="category-country-sankey-chart" className="relative">
          <ReactECharts
            option={options}
            style={{ height: '700px', width: '100%' }} // Increased height for better view
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

export default CategoryCountrySankeyPlot;
