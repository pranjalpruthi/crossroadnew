import React, { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, Network, Maximize2, Filter, X } from 'lucide-react'; // Added Filter, X icons
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
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

// Type for the data structure expected from the query result (assuming plot_source)
interface PlotSourceDataRow {
  gene?: string | null; // Changed from category
  country?: string | null;
  genomeID?: string | null;
  // Include other fields from plot_source if needed, though not used directly here
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
  links: { source: number; target: number; value: number; sourceName: string; targetName: string }[]; // Added names for tooltip
}

// Define the structure for the calculated statistics processed internally
interface ProcessedSankeyStats {
    total_genes: number; // Changed from categories
    total_countries: number;
    total_unique_genomes: number;
    total_links_shown: number;
    total_genome_flow: number;
}

// Props now accept the raw query result for link data and hotspot gene data
interface GeneCountrySankeyPlotProps {
  linkDataQueryResult: UseQueryResult<QueryFnData, Error>; // Data for gene -> country links
  hotspotDataQueryResult: UseQueryResult<QueryFnData, Error>; // Data for identifying hotspot genes (e.g., hssr_data)
}

// Helper function to generate HSL colors (similar to Python logic)
// Using a slightly different saturation/lightness for genes vs categories
function getHslColor(index: number, total: number, saturation = 0.6, lightness = 0.5): string {
    const hue = (index / total) % 1.0;
    return `hsl(${Math.round(hue * 360)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`;
}

const GeneCountrySankeyPlot: React.FC<GeneCountrySankeyPlotProps> = ({ linkDataQueryResult, hotspotDataQueryResult }) => {
  const { data: linkQueryData, isLoading: isLoadingLinks, isError: isErrorLinks, error: errorLinks } = linkDataQueryResult;
  const { data: hotspotQueryData, isLoading: isLoadingHotspots, isError: isErrorHotspots, error: errorHotspots } = hotspotDataQueryResult;

  // Filter state
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [isGeneFilterOpen, setIsGeneFilterOpen] = useState(false);
  const [isCountryFilterOpen, setIsCountryFilterOpen] = useState(false);
  
  // Available options for filters
  const [availableGenes, setAvailableGenes] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  // Process data inside the component using useMemo
  const processedData = useMemo(() => {
    if (
      !linkQueryData?.data || !Array.isArray(linkQueryData.data) || linkQueryData.data.length === 0 ||
      !hotspotQueryData?.data || !Array.isArray(hotspotQueryData.data) || hotspotQueryData.data.length === 0
    ) {
      return null;
    }

    const rawLinkData = linkQueryData.data as PlotSourceDataRow[];
    const rawHotspotData = hotspotQueryData.data as PlotSourceDataRow[]; // Assuming same structure or at least a 'gene' field

    // Extract unique hotspot genes
    const hotspotGenes = new Set(
      rawHotspotData
        .map(row => row.gene)
        .filter(gene => gene !== null && gene !== undefined && gene !== '')
        .map(gene => String(gene!))
    );

    if (hotspotGenes.size === 0) {
      console.warn("GeneCountrySankeyPlot: No hotspot genes found from hotspotDataQueryResult.");
      return null; // Or handle as "no data to show"
    }

    // Filter rawLinkData to include only hotspot genes and valid rows
    const df_proc_filtered_by_hotspot = rawLinkData
      .filter(row =>
        row.gene !== null && row.gene !== undefined && row.gene !== '' &&
        hotspotGenes.has(String(row.gene!)) && // Check if the gene is a hotspot gene
        row.country !== null && row.country !== undefined && row.country !== '' &&
        row.genomeID !== null && row.genomeID !== undefined && row.genomeID !== ''
      )
      .map(row => ({
        gene: String(row.gene!),
        country: String(row.country!),
        genomeID: String(row.genomeID!),
      }));

    if (df_proc_filtered_by_hotspot.length === 0) {
      console.warn("GeneCountrySankeyPlot: No link data remains after filtering by hotspot genes.");
      return null;
    }
    
    // df_proc is now the data filtered by hotspot genes
    const df_proc = df_proc_filtered_by_hotspot;

    // Update available filters based on the *filtered* data
    const allGenes = [...new Set(df_proc.map(r => r.gene))].sort();
    const allCountries = [...new Set(df_proc.map(r => r.country))].sort();
    
    // Update filter options when data changes
    if (JSON.stringify(allGenes) !== JSON.stringify(availableGenes)) {
      setAvailableGenes(allGenes);
    }
    if (JSON.stringify(allCountries) !== JSON.stringify(availableCountries)) {
      setAvailableCountries(allCountries);
    }

    // Apply filters if any are selected
    let filteredData = df_proc;
    if (selectedGenes.length > 0) {
      filteredData = filteredData.filter(row => selectedGenes.includes(row.gene));
    }
    if (selectedCountries.length > 0) {
      filteredData = filteredData.filter(row => selectedCountries.includes(row.country));
    }

    // Aggregate link data (gene -> country : count unique genomeIDs)
    const linkDataMap = filteredData.reduce((acc, row) => {
        const key = `${row.gene}__${row.country}`;
        acc[key] = acc[key] || { gene: row.gene, country: row.country, genomes: new Set<string>() };
        acc[key].genomes.add(row.genomeID);
        return acc;
    }, {} as Record<string, { gene: string; country: string; genomes: Set<string> }>);

    const links = Object.values(linkDataMap).map(item => ({
        sourceName: item.gene, // Keep original names for tooltips
        targetName: item.country,
        value: item.genomes.size,
    })).filter(link => link.value > 0);

    if (links.length === 0) return null;

    // Prepare nodes
    const unique_genes = [...new Set(links.map(l => l.sourceName))].sort();
    const unique_countries = [...new Set(links.map(l => l.targetName))].sort();
    const nodes = [...unique_genes, ...unique_countries];
    const nodeMap = Object.fromEntries(nodes.map((name, i) => [name, i]));

    // Map links to indices
    const mappedLinks = links.map(link => ({
        source: nodeMap[link.sourceName],
        target: nodeMap[link.targetName],
        value: link.value,
        sourceName: link.sourceName, // Pass names through for tooltip
        targetName: link.targetName,
    }));

    // --- Calculate Stats ---
    const total_unique_genomes_in_data = new Set(filteredData.map(r => r.genomeID)).size;
    const total_flow = mappedLinks.reduce((sum, link) => sum + link.value, 0);
    const stats: ProcessedSankeyStats = {
        total_genes: unique_genes.length,
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

  }, [linkQueryData, hotspotQueryData, selectedGenes, selectedCountries, availableGenes, availableCountries]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedGenes([]);
    setSelectedCountries([]);
  };

  // Helper for filter selection
  const toggleGeneSelection = (gene: string) => {
    setSelectedGenes(prev => 
      prev.includes(gene) 
        ? prev.filter(g => g !== gene) 
        : [...prev, gene]
    );
  };

  const toggleCountrySelection = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country) 
        : [...prev, country]
    );
  };

  // --- Fullscreen Logic ---
  const chartId = "gene-country-sankey-chart"; // Unique ID
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
        chartDiv.style.height = 'auto';
        chartDiv.style.padding = '0';
      }
      // Consider resizing ECharts instance
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

  const isLoading = isLoadingLinks || isLoadingHotspots;
  const isError = isErrorLinks || isErrorHotspots;
  const error = errorLinks || errorHotspots;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="text-lg flex items-center">
            <Network className="mr-2 h-5 w-5" />
            Gene → Country Sankey Plot
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
    const errorMessage = isError ? (error?.message || 'Failed to load plot data.') : 'No data available or processing failed for Gene → Country Sankey.';
    return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-lg flex items-center">
             <Network className="mr-2 h-5 w-5" />
             Gene → Country Sankey Plot
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

  // Assign colors to nodes (Genes get HSL, Countries get default palette)
  const numGenes = stats.total_genes;
  const nodeColors = chartData.nodes.map((_node, index) => {
      if (index < numGenes) {
          // Gene node
          return getHslColor(index, numGenes); // Use helper
      } else {
          // Country node - use ECharts default palette cycling
          return undefined; // Let ECharts assign default color
      }
  });

  // Assign link colors based on source node color with alpha (0.6)
  const linkColors = chartData.links.map(link => {
      const sourceNodeIndex = link.source;
      const sourceColor = nodeColors[sourceNodeIndex];
      if (sourceColor) {
          try {
              const match = sourceColor.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
              if (match) {
                  return `hsla(${match[1]}, ${match[2]}%, ${match[3]}%, 0.6)`; // Add alpha 0.6
              }
          } catch (e) { /* ignore parsing error, fallback below */ }
      }
      return 'rgba(204, 204, 204, 0.6)'; // Fallback grey with alpha
  });


  // ECharts options configuration
  const options = {
    title: {
      text: 'Genome Distribution: Hotspot Gene → Country', // Updated Title
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => { // Use names stored in link data
        if (params.dataType === 'edge' && params.data) {
          return `${params.data.sourceName} → ${params.data.targetName}: ${params.data.value.toLocaleString()} Genomes`;
        }
        if (params.dataType === 'node') {
           return `${params.name}`; // Just show node name
        }
        return '';
      }
    },
    series: [
      {
        type: 'sankey',
        data: chartData.nodes.map((node, index) => ({
            name: node.name, // Ensure name is passed
            itemStyle: {
                color: nodeColors[index] // Assign specific color or let ECharts default
            }
        })),
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
          // color: 'gradient', // Let specific link colors override
          curveness: 0.5
        },
        label: {
            fontSize: 10,
            color: '#444' // Slightly darker label
        },
        nodeAlign: 'justify', // Align nodes vertically
        nodeGap: 12, // Gap between nodes
        nodeWidth: 20, // Thickness from Python code
        nodePad: 15, // Pad from Python code
      }
    ],
     toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
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
           <Network className="mr-2 h-5 w-5" />
           Gene → Country Sankey Plot
        </CardTitle>
        {/* Button Group */}
        <div className="flex items-center gap-2">
          {/* Gene Filter */}
          <Popover open={isGeneFilterOpen} onOpenChange={setIsGeneFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={selectedGenes.length > 0 ? "border-primary text-primary" : ""}>
                <Filter className="h-4 w-4" />
                <span className="ml-2">Genes</span>
                {selectedGenes.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{selectedGenes.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search genes..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No genes found.</CommandEmpty>
                  <CommandGroup>
                    {availableGenes.map(gene => (
                      <CommandItem 
                        key={gene} 
                        onSelect={() => toggleGeneSelection(gene)}
                        className="flex items-center justify-between"
                      >
                        <span>{gene}</span>
                        {selectedGenes.includes(gene) && (
                          <Badge variant="outline" className="ml-2">Selected</Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Country Filter */}
          <Popover open={isCountryFilterOpen} onOpenChange={setIsCountryFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={selectedCountries.length > 0 ? "border-primary text-primary" : ""}>
                <Filter className="h-4 w-4" />
                <span className="ml-2">Countries</span>
                {selectedCountries.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{selectedCountries.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search countries..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No countries found.</CommandEmpty>
                  <CommandGroup>
                    {availableCountries.map(country => (
                      <CommandItem 
                        key={country} 
                        onSelect={() => toggleCountrySelection(country)}
                        className="flex items-center justify-between"
                      >
                        <span>{country}</span>
                        {selectedCountries.includes(country) && (
                          <Badge variant="outline" className="ml-2">Selected</Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Show All / Reset Button */}
          {(selectedGenes.length > 0 || selectedCountries.length > 0) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <X className="h-4 w-4" />
              <span className="ml-2">Show All</span>
            </Button>
          )}

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
                    <span className="text-muted-foreground">Hotspot Genes:</span>
                    <Badge variant="secondary">{stats.total_genes.toLocaleString()}</Badge>
                 </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Countries:</span>
                    <Badge variant="secondary">{stats.total_countries.toLocaleString()}</Badge>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Unique Genomes:</span>
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
                 
                 {/* Filter info */}
                 {(selectedGenes.length > 0 || selectedCountries.length > 0) && (
                   <>
                     <Separator className="my-2" />
                     <p className="text-muted-foreground text-xs">Showing filtered data.</p>
                   </>
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
         {/* Filter indicators */}
         {(selectedGenes.length > 0 || selectedCountries.length > 0) && (
           <div className="mb-4 flex flex-wrap gap-2">
             {selectedGenes.length > 0 && (
               <div className="flex items-center">
                 <span className="text-xs text-muted-foreground mr-2">Genes:</span>
                 <div className="flex flex-wrap gap-1">
                   {selectedGenes.map(gene => (
                     <Badge key={gene} variant="outline" className="flex items-center gap-1">
                       {gene}
                       <X 
                         className="h-3 w-3 cursor-pointer" 
                         onClick={() => toggleGeneSelection(gene)}
                       />
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
             
             {selectedCountries.length > 0 && (
               <div className="flex items-center">
                 <span className="text-xs text-muted-foreground mr-2">Countries:</span>
                 <div className="flex flex-wrap gap-1">
                   {selectedCountries.map(country => (
                     <Badge key={country} variant="outline" className="flex items-center gap-1">
                       {country}
                       <X 
                         className="h-3 w-3 cursor-pointer" 
                         onClick={() => toggleCountrySelection(country)}
                       />
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
             
             <Button variant="ghost" size="sm" className="h-6" onClick={handleResetFilters}>
               <X className="h-3 w-3" />
               <span className="ml-1 text-xs">Clear All</span>
             </Button>
           </div>
         )}
       
         {/* Chart Area takes full width */}
         <div id={chartId} className="relative">
             <ReactECharts
               option={options}
               style={{ height: `${Math.max(600, stats.total_genes * 25, stats.total_countries * 25)}px`, width: '100%' }}
               notMerge={true}
               lazyUpdate={true}
               theme={"light"}
             />
         </div>
      </CardContent>
    </Card>
  );
};

export default GeneCountrySankeyPlot;
