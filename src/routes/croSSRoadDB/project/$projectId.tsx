import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useInfiniteQuery, useQueries, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Dna,
  Repeat,
  Activity,
  BarChart3,
  Info,
  Download,
  Filter,
  ChevronDown,
  ChevronUpIcon,
  ChevronDownIcon,

} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import React, { useMemo, useState, useRef } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,

  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

// Import existing plot components
import RelativeAbundancePlot from '@/components/plots/RelativeAbundancePlot'
import RelativeDensityPlot from '@/components/plots/RelativeDensityPlot'
import CategoryCountrySankeyPlot from '@/components/plots/CategoryCountrySankeyPlot'
import GeneCountrySankeyPlot from '@/components/plots/GeneCountrySankeyPlot'
import MotifConservationPlot from '@/components/plots/MotifConservationPlot'
import MotifDistributionHeatmap from '@/components/plots/MotifDistributionHeatmap'
import SsrConservationPlot from '@/components/plots/SsrConservationPlot'
import SsrGcDistributionPlot from '@/components/plots/SsrGcDistributionPlot'
import SsrGeneIntersectionPlot from '@/components/plots/SsrGeneIntersectionPlot'
import HotspotPlot from '@/components/plots/HotspotPlot'
import TemporalFacetedScatterPlot from '@/components/plots/TemporalFacetedScatterPlot'
import ReferenceSsrDistributionPlot from '@/components/plots/ReferenceSsrDistributionPlot'
import SsrGeneGenomeDotPlot from '@/components/plots/SsrGeneGenomeDotPlot'
import UpsetPlot from '@/components/plots/UpsetPlot'

// Define plot keys similar to analysis page
const PLOT_KEYS_TO_FETCH = ['plot_source', 'hssr_data', 'hotspot', 'ssr_gene_intersect', 'gene_country_sankey'] as const
type PlotKey = typeof PLOT_KEYS_TO_FETCH[number]
type PlotQueryResult = UseQueryResult<{ plotKey: PlotKey; data: any[] | null; error?: string }, Error>

// --- Virtual DataTable Component with Infinite Scrolling ---
interface VirtualDataTableProps {
  projectId: string;
  plotKey: PlotKey;
  tableName: string;
  caption?: string;
}







// Virtual DataTable with infinite scrolling
function VirtualDataTable({ projectId, plotKey, tableName, caption }: VirtualDataTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const parentRef = useRef<HTMLDivElement>(null);

  // Get runs for this project first
  const { data: runs } = useQuery({
    queryKey: ['project_runs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_runs')
        .select('*')
        .eq('project_id', projectId)

      if (error) throw error
      return data
    },
  })

  // Infinite query for table data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['virtualTableData', projectId, plotKey, globalFilter, sorting],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!runs || runs.length === 0) {
        return { data: [], nextCursor: null, hasMore: false }
      }

      const runIds = runs.map(run => run.run_id)
      let tableName: string
      const pageSize = 100 // Smaller page size for virtual scrolling

      // Map plot keys to database tables
      switch (plotKey) {
        case 'plot_source':
          tableName = 'merged_out'
          break
        case 'hssr_data':
          tableName = 'hssr_data'
          break
        case 'hotspot':
          tableName = 'mutational_hotspots'
          break
        case 'ssr_gene_intersect':
          tableName = 'ssr_genecombo'
          break
        case 'gene_country_sankey':
          tableName = 'ref_ssr_genecombo'
          break
        default:
          return { data: [], nextCursor: null, hasMore: false }
      }

      const from = pageParam * pageSize
      const to = from + pageSize - 1

      // Build query with pagination
      let query = supabase
        .from(tableName)
        .select('*')
        .in('run_id', runIds)
        .range(from, to)

      // Add global filter if present
      if (globalFilter) {
        // Simple text search across all columns - you might want to make this more sophisticated
        query = query.or(`genome_id.ilike.%${globalFilter}%,motif.ilike.%${globalFilter}%,category.ilike.%${globalFilter}%,optional_category.ilike.%${globalFilter}%`)
      }

      // Add sorting
      if (sorting.length > 0) {
        const sort = sorting[0]
        query = query.order(sort.id, { ascending: !sort.desc })
      } else {
        // Default ordering
        if (plotKey === 'hotspot') {
          query = query.order('genomeid_count', { ascending: false })
        } else if (tableName === 'merged_out') {
          query = query.order('genome_id', { ascending: true }).order('start_pos', { ascending: true })
        } else if (tableName.includes('hssr') || tableName.includes('ssr_gene') || tableName.includes('ref_ssr')) {
          query = query.order('genome_id', { ascending: true }).order('start1', { ascending: true })
        } else {
          query = query.order('genome_id', { ascending: true })
        }
      }

      const { data: result, error } = await query

      if (error) throw error

      // Transform data to match analysis page format
      const transformedData = result?.map((row: any) => {
        const transformed: any = { ...row }

        if (row && typeof row === 'object') {
          // Core mappings for merged_out (plot_source)
          if ('genome_id' in row) transformed.genomeID = row.genome_id
          if ('start_pos' in row) transformed.start = row.start_pos
          if ('stop_pos' in row) transformed.stop = row.stop_pos
          if ('repeat_count' in row) transformed.repeat = row.repeat_count
          if ('gc_per' in row) transformed.GC_per = row.gc_per
          if ('at_per' in row) transformed.AT_per = row.at_per
          if ('n_count' in row) transformed.N_count = row.n_count
          if ('genome_gc_per' in row) transformed.genome_GC_per = row.genome_gc_per

          // Additional mappings for hssr_data and ssr_genecombo tables
          if ('genome_id2' in row) transformed.genomeID2 = row.genome_id2
          if ('start1' in row) transformed.start1 = row.start1
          if ('end1' in row) transformed.end1 = row.end1
          if ('start2' in row) transformed.start2 = row.start2
          if ('end2' in row) transformed.end2 = row.end2

          // Hotspot-specific mappings
          if ('genomeid_count' in row) transformed.genomeID_count = row.genomeid_count
          if ('loci_variations' in row) transformed.loci = row.loci_variations
          if ('ssr_length_variations' in row) transformed.length_of_ssr = row.ssr_length_variations
          if ('repeat_count_variations' in row) transformed.repeat_count = row.repeat_count_variations

          // Keep original column names as well for compatibility
          if ('motif' in row) transformed.motif = row.motif
          if ('gene' in row) transformed.gene = row.gene
          if ('category' in row) transformed.category = row.category
          if ('optional_category' in row) transformed.optional_category = row.optional_category
          if ('year' in row) transformed.year = row.year
          if ('length_of_motif' in row) transformed.length_of_motif = row.length_of_motif
          if ('loci' in row) transformed.loci = row.loci
          if ('length_of_ssr' in row) transformed.length_of_ssr = row.length_of_ssr
          if ('length_genome' in row) transformed.length_genome = row.length_genome
          if ('ssr_position' in row) transformed.ssr_position = row.ssr_position
        }

        return transformed
      }) || []

      const hasMore = result && result.length === pageSize
      const nextCursor = hasMore ? pageParam + 1 : null

      return {
        data: transformedData,
        nextCursor,
        hasMore
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: { nextCursor: number | null }) => lastPage.nextCursor,
    enabled: !!runs && runs.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Flatten all pages into a single array
  const allRows = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.data) ?? []
  }, [data])

  // Generate columns dynamically with consistent ordering
  const columns = useMemo(() => {
    if (allRows.length === 0) return []

    // Get all unique column keys from the first few rows to ensure consistency
    const columnKeys = new Set<string>()
    const sampleSize = Math.min(10, allRows.length)

    for (let i = 0; i < sampleSize; i++) {
      Object.keys(allRows[i] || {}).forEach(key => columnKeys.add(key))
    }

    // Convert to sorted array for consistent ordering
    const sortedKeys = Array.from(columnKeys).sort()

    return sortedKeys.map(colKey => ({
      accessorKey: colKey,
      header: colKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      size: 160, // Fixed size for consistency
      minSize: 160,
      maxSize: 160,
    }))
  }, [allRows])

  const table = useReactTable({
    data: allRows,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // We handle sorting in the query
    manualFiltering: true, // We handle filtering in the query
  })

  // Debug: Log column information
  React.useEffect(() => {
    if (allRows.length > 0) {
      console.log('🔍 DEBUG - Column Analysis:')
      console.log('Generated columns:', columns.map(c => c.accessorKey))
      console.log('First row keys:', Object.keys(allRows[0]))
      console.log('Table headers:', table.getHeaderGroups()[0]?.headers.map(h => h.id))
      console.log('Visible columns:', table.getVisibleLeafColumns().map(c => c.id))
      console.log('First row data sample:', allRows[0])
    }
  }, [columns, allRows, table])

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  // Load more data when scrolling near the end
  const lastItem = virtualItems[virtualItems.length - 1]

  // Effect to load more data when scrolling near the end
  React.useEffect(() => {
    if (
      lastItem &&
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [lastItem, hasNextPage, fetchNextPage, isFetchingNextPage, rows.length])

  const handleDownload = () => {
    const headers = table.getAllColumns()
      .filter(column => column.getIsVisible())
      .map(column => column.id);

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const value = row.getValue(header);
          const stringValue = value === null || value === undefined ? '' : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription>{(error as Error)?.message || 'Failed to load table data'}</AlertDescription>
      </Alert>
    )
  }

  if (allRows.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available for this table.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <Input
              placeholder="Search across all columns..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="w-full sm:w-80 h-9 text-sm pl-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
            />
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700">
                <ChevronDown className="h-4 w-4" />
                Show/Hide Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px] max-h-[300px] overflow-y-auto">
              <div className="p-2 text-xs font-medium text-muted-foreground border-b mb-2">
                Toggle column visibility
              </div>
              {table.getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize text-sm"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="font-medium">{allRows.length.toLocaleString()}</span>
            <span>rows loaded</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-9 gap-2 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Virtual Table using shadcn/ui components */}
      <div className="w-full border rounded-lg shadow-sm bg-background">
        {caption && (
          <div className="px-4 py-3 text-sm text-muted-foreground border-b bg-muted/50 rounded-t-lg">
            {caption}
          </div>
        )}

        <Table style={{ minWidth: `${table.getVisibleLeafColumns().length * 160}px` }}>
          <colgroup>
            {table.getVisibleLeafColumns().map(column => (
              <col key={column.id} style={{ width: '160px' }} />
            ))}
          </colgroup>

          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none hover:bg-muted/80 transition-colors px-3 py-4"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold uppercase tracking-wide">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <div className="flex-shrink-0">
                        {{
                          asc: <ChevronUpIcon className="h-4 w-4 text-primary" />,
                          desc: <ChevronDownIcon className="h-4 w-4 text-primary" />,
                        }[header.column.getIsSorted() as string] ?? (
                            <div className="h-4 w-4 opacity-0 group-hover:opacity-50">
                              <ChevronUpIcon className="h-4 w-4" />
                            </div>
                          )}
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            <TableRow>
              <TableCell colSpan={table.getVisibleLeafColumns().length} className="p-0">
                <div
                  ref={parentRef}
                  className="h-[600px] overflow-y-auto"
                >
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      position: 'relative',
                    }}
                  >
                    {virtualItems.map((virtualItem) => {
                      const isLoaderRow = virtualItem.index > rows.length - 1
                      const row = rows[virtualItem.index]

                      return (
                        <div
                          key={virtualItem.index}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                          className={`border-b hover:bg-muted/50 transition-colors ${virtualItem.index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                            }`}
                        >
                          {isLoaderRow ? (
                            <div className="flex items-center justify-center w-full py-6">
                              {hasNextPage ? (
                                <div className="flex items-center gap-3">
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                                  <span className="text-sm text-muted-foreground font-medium">Loading more data...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <div className="h-1 w-1 rounded-full bg-current"></div>
                                  <span className="text-sm">End of data</span>
                                  <div className="h-1 w-1 rounded-full bg-current"></div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Table>
                              <colgroup>
                                {table.getVisibleLeafColumns().map(column => (
                                  <col key={column.id} style={{ width: '160px' }} />
                                ))}
                              </colgroup>
                              <TableBody>
                                <TableRow className="border-0 hover:bg-transparent">
                                  {row.getVisibleCells().map((cell, cellIndex) => (
                                    <TableCell
                                      key={cell.id}
                                      className={`px-3 py-3 ${cellIndex === 0 ? 'font-medium' : ''}`}
                                    >
                                      <div className="truncate w-full" title={String(cell.getValue())}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                      </div>
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border text-sm">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Displaying <span className="font-semibold text-foreground">{allRows.length.toLocaleString()}</span> rows
          </span>
          {hasNextPage && (
            <span className="text-blue-600 dark:text-blue-400 text-xs">
              • Scroll down to load more
            </span>
          )}
        </div>
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
            <span className="text-xs font-medium">Loading...</span>
          </div>
        )}
      </div>
    </div>
  )
}



export const Route = createFileRoute('/croSSRoadDB/project/$projectId')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()

  // Get project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project_detail', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error) throw error
      return data
    },
  })

  // Get analysis runs for this project
  const { data: runs, isLoading: isLoadingRuns } = useQuery({
    queryKey: ['project_runs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_runs')
        .select('*')
        .eq('project_id', projectId)

      if (error) throw error
      return data
    },
  })

  // Fetch plot data using useQueries similar to analysis page
  const plotDataQueries = useQueries({
    queries: PLOT_KEYS_TO_FETCH.map((plotKey) => ({
      queryKey: ['projectPlotData', projectId, plotKey],
      queryFn: async (): Promise<{ plotKey: PlotKey; data: any[] | null; error?: string }> => {
        if (!runs || runs.length === 0) {
          return { plotKey, data: null }
        }

        const runIds = runs.map(run => run.run_id)
        let tableName: string
        let selectFields = '*'

        // Map plot keys to database tables - NO LIMITS to get full datasets
        switch (plotKey) {
          case 'plot_source':
            tableName = 'merged_out'
            break
          case 'hssr_data':
            tableName = 'hssr_data'
            break
          case 'hotspot':
            tableName = 'mutational_hotspots'
            break
          case 'ssr_gene_intersect':
            tableName = 'ssr_genecombo'
            break
          case 'gene_country_sankey':
            tableName = 'ref_ssr_genecombo'
            break
          default:
            return { plotKey, data: null }
        }

        try {
          console.log(`Fetching ${plotKey} data from ${tableName} for run_id(s): ${runIds.join(', ')}...`)

          // For plots, we only need a reasonable sample size, not ALL data
          // This prevents memory issues and improves performance
          const maxRowsForPlots = plotKey === 'hotspot' ? 1000 : 5000; // Hotspots are usually small

          let query = supabase
            .from(tableName)
            .select(selectFields)
            .in('run_id', runIds)
            .limit(maxRowsForPlots)

          // Add ordering based on table structure
          if (plotKey === 'hotspot') {
            // mutational_hotspots: ORDER BY genomeid_count DESC
            query = query.order('genomeid_count', { ascending: false })
          } else if (tableName === 'merged_out') {
            // merged_out: ORDER BY genome_id, start_pos
            query = query.order('genome_id', { ascending: true }).order('start_pos', { ascending: true })
          } else if (tableName.includes('hssr') || tableName.includes('ssr_gene') || tableName.includes('ref_ssr')) {
            // hssr_data, ssr_genecombo, ref_ssr_genecombo: ORDER BY genome_id, start1
            query = query.order('genome_id', { ascending: true }).order('start1', { ascending: true })
          } else {
            // Default ordering
            query = query.order('genome_id', { ascending: true })
          }

          const { data, error } = await query

          if (error) throw error

          console.log(`✅ Fetched sample dataset: ${data?.length || 0} rows for ${plotKey} (limited to ${maxRowsForPlots} for performance)`)

          // Transform data to match analysis page format
          const transformedData = data?.map((row: any) => {
            // Convert database column names to match analysis page expectations
            const transformed: any = { ...row }

            // Map database columns to expected format based on your Python script
            if (row && typeof row === 'object') {
              // Core mappings for merged_out (plot_source)
              if ('genome_id' in row) transformed.genomeID = row.genome_id
              if ('start_pos' in row) transformed.start = row.start_pos
              if ('stop_pos' in row) transformed.stop = row.stop_pos
              if ('repeat_count' in row) transformed.repeat = row.repeat_count
              if ('gc_per' in row) transformed.GC_per = row.gc_per
              if ('at_per' in row) transformed.AT_per = row.at_per
              if ('n_count' in row) transformed.N_count = row.n_count
              if ('genome_gc_per' in row) transformed.genome_GC_per = row.genome_gc_per

              // Additional mappings for hssr_data and ssr_genecombo tables
              if ('genome_id2' in row) transformed.genomeID2 = row.genome_id2
              if ('start1' in row) transformed.start1 = row.start1
              if ('end1' in row) transformed.end1 = row.end1
              if ('start2' in row) transformed.start2 = row.start2
              if ('end2' in row) transformed.end2 = row.end2

              // Hotspot-specific mappings
              if ('genomeid_count' in row) transformed.genomeID_count = row.genomeid_count
              if ('loci_variations' in row) transformed.loci = row.loci_variations
              if ('ssr_length_variations' in row) transformed.length_of_ssr = row.ssr_length_variations
              if ('repeat_count_variations' in row) transformed.repeat_count = row.repeat_count_variations

              // Keep original column names as well for compatibility
              if ('motif' in row) transformed.motif = row.motif
              if ('gene' in row) transformed.gene = row.gene
              if ('category' in row) transformed.category = row.category
              if ('optional_category' in row) transformed.optional_category = row.optional_category
              if ('year' in row) transformed.year = row.year
              if ('length_of_motif' in row) transformed.length_of_motif = row.length_of_motif
              if ('loci' in row) transformed.loci = row.loci
              if ('length_of_ssr' in row) transformed.length_of_ssr = row.length_of_ssr
              if ('length_genome' in row) transformed.length_genome = row.length_genome
              if ('ssr_position' in row) transformed.ssr_position = row.ssr_position
            }

            return transformed
          }) || []

          return { plotKey, data: transformedData }
        } catch (error: any) {
          console.error(`Failed to fetch data for ${plotKey}:`, error)
          return { plotKey, data: null, error: error.message || 'Fetch Error' }
        }
      },
      enabled: !!runs && runs.length > 0,
      staleTime: Infinity,
    })),
  })

  // Process query results into a map for easy access
  const queryResultsMap = plotDataQueries.reduce((acc, result, index) => {
    const plotKey = PLOT_KEYS_TO_FETCH[index]
    acc[plotKey] = result
    return acc
  }, {} as Record<PlotKey, PlotQueryResult>)

  // Generate columns for tables dynamically based on fetched data
  const availableTableData = useMemo(() => {
    return PLOT_KEYS_TO_FETCH.reduce((acc, key) => {
      const result = queryResultsMap[key]
      if (result.isSuccess && result.data?.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
        const data = result.data.data
        const columns = Object.keys(data[0]).map(colKey => ({
          accessorKey: colKey,
          header: colKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        }))
        acc[key] = { data, columns }
      }
      return acc
    }, {} as Record<PlotKey, { data: any[]; columns: ColumnDef<any>[] }>)
  }, [queryResultsMap])

  // Get individual query results for plots
  const plotSourceResult = queryResultsMap['plot_source']
  const geneCountrySankeyResult = queryResultsMap['gene_country_sankey']
  const ssrGeneIntersectResult = queryResultsMap['ssr_gene_intersect']
  const hotspotResult = queryResultsMap['hotspot']
  const hssrDataResult = queryResultsMap['hssr_data']

  // Check data availability
  const isPlotSourceLoading = plotSourceResult?.isLoading
  const isPlotSourceAvailable = plotSourceResult?.isSuccess && plotSourceResult?.data?.data && plotSourceResult.data.data.length > 0

  const isGeneCountrySankeyLoading = geneCountrySankeyResult?.isLoading
  const isGeneCountrySankeyAvailable = geneCountrySankeyResult?.isSuccess && geneCountrySankeyResult?.data?.data && geneCountrySankeyResult.data.data.length > 0

  const isSsrGeneIntersectLoading = ssrGeneIntersectResult?.isLoading
  const isSsrGeneIntersectAvailable = ssrGeneIntersectResult?.isSuccess && ssrGeneIntersectResult?.data?.data && ssrGeneIntersectResult.data.data.length > 0

  const isHotspotLoading = hotspotResult?.isLoading
  const isHotspotAvailable = hotspotResult?.isSuccess && hotspotResult?.data?.data && hotspotResult.data.data.length > 0

  const isHssrDataLoading = hssrDataResult?.isLoading
  const isHssrDataAvailable = hssrDataResult?.isSuccess && hssrDataResult?.data?.data && hssrDataResult.data.data.length > 0

  // Calculate stats from analysis_runs table (real counts) and fetched data
  const totalGenomes = runs?.reduce((sum, run) => sum + (run.genomes_used_count || 0), 0) || 0

  // Use real counts from analysis_runs table if available, otherwise fall back to fetched data length
  const totalSSRs = runs?.reduce((sum, run) => sum + (run.ssrs_total_count || 0), 0) ||
    plotSourceResult?.data?.data?.length || 0

  const totalHSSRs = runs?.reduce((sum, run) => sum + (run.hssr_records_count || 0), 0) ||
    hssrDataResult?.data?.data?.length || 0

  const totalHotspots = runs?.reduce((sum, run) => sum + (run.hotspots_filtered_count || 0), 0) ||
    hotspotResult?.data?.data?.length || 0

  // Get reference ID from runs
  const referenceId = runs?.[0]?.reference_genome_id || null

  const isLoading = isLoadingProject || isLoadingRuns || plotDataQueries.some(q => q.isLoading)

  if (isLoadingProject) {
    return (
      <div className="container mx-auto pt-24 pb-8 px-4 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto pt-24 pb-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-4">The requested project could not be found.</p>
            <Button onClick={() => navigate({ to: '/croSSRoadDB' })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Database
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto pt-24 pb-8 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate({ to: '/croSSRoadDB' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Database
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{project.project_name}</h1>
            <Badge variant="outline">#{project.project_id}</Badge>
          </div>
          <p className="text-xl text-primary font-medium">{project.organism_name}</p>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomes</CardTitle>
            <Dna className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGenomes.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSRs</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSSRs.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HSSRs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHSSRs.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hotspots</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHotspots.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Availability Summary */}
      {!isLoading && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Available Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPlotSourceAvailable ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>Core Data ({plotSourceResult?.data?.data?.length?.toLocaleString() || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isSsrGeneIntersectAvailable ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>SSR-Gene ({ssrGeneIntersectResult?.data?.data?.length?.toLocaleString() || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isHotspotAvailable ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>Hotspots ({hotspotResult?.data?.data?.length?.toLocaleString() || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isHssrDataAvailable ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>HSSR ({hssrDataResult?.data?.data?.length?.toLocaleString() || 0})</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                📊 Plots use sample data for performance. 📋 Tables load complete datasets with infinite scrolling.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Using Analysis Page Plot Components */}
      <Tabs defaultValue="core_data" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="core_data">Core Data</TabsTrigger>
          <TabsTrigger value="ssr_gene_intersection">SSR-Gene</TabsTrigger>
          <TabsTrigger value="hotspot_data">Hotspots</TabsTrigger>
          <TabsTrigger value="hssr_data">HSSR Data</TabsTrigger>
          <TabsTrigger value="data_tables">All Tables</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="core_data" className="space-y-4">
          {isPlotSourceLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : isPlotSourceAvailable && availableTableData['plot_source'] ? (
            <>
              <Tabs defaultValue="category_country_sankey" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-8 mb-4">
                  <TabsTrigger value="category_country_sankey" className="text-xs px-2 py-1.5">Cat → Optional</TabsTrigger>
                  <TabsTrigger value="ssr_gc_distribution" className="text-xs px-2 py-1.5">SSR GC Dist.</TabsTrigger>
                  <TabsTrigger value="motif_conservation" className="text-xs px-2 py-1.5">Motif Conserv.</TabsTrigger>
                  <TabsTrigger value="ssr_conservation" className="text-xs px-2 py-1.5">SSR Conserv.</TabsTrigger>
                  <TabsTrigger value="upset_plot" className="text-xs px-2 py-1.5">UpSet Plot</TabsTrigger>
                  <TabsTrigger value="relative_abundance" className="text-xs px-2 py-1.5">Rel. Abundance</TabsTrigger>
                  <TabsTrigger value="relative_density" className="text-xs px-2 py-1.5">Rel. Density</TabsTrigger>
                  <TabsTrigger value="motif_distribution_heatmap" className="text-xs px-2 py-1.5">Motif Heatmap</TabsTrigger>
                </TabsList>
                <TabsContent value="category_country_sankey"><CategoryCountrySankeyPlot queryResult={plotSourceResult} /></TabsContent>
                <TabsContent value="ssr_gc_distribution"><SsrGcDistributionPlot queryResult={plotSourceResult} /></TabsContent>
                <TabsContent value="motif_conservation"><MotifConservationPlot queryResult={plotSourceResult} /></TabsContent>
                <TabsContent value="ssr_conservation"><SsrConservationPlot queryResult={plotSourceResult} /></TabsContent>
                <TabsContent value="upset_plot"><UpsetPlot queryResult={plotSourceResult} /></TabsContent>
                <TabsContent value="relative_abundance"><RelativeAbundancePlot queryResult={plotSourceResult} /></TabsContent>
                <TabsContent value="relative_density"><RelativeDensityPlot queryResult={plotSourceResult} /></TabsContent>
                <TabsContent value="motif_distribution_heatmap"><MotifDistributionHeatmap queryResult={plotSourceResult} /></TabsContent>
              </Tabs>

              <Separator className="my-6" />

              {/* Core Analysis Data Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Core Analysis Data</h3>
                <VirtualDataTable
                  projectId={projectId}
                  plotKey="plot_source"
                  tableName="core_data"
                  caption="Complete core analysis data from merged_out table - all SSR records with genomic positions, motifs, and metadata."
                />
              </div>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Core Data</AlertTitle>
              <AlertDescription>Core data is not available for this project.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="ssr_gene_intersection" className="space-y-4">
          {isSsrGeneIntersectLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : isSsrGeneIntersectAvailable && availableTableData['ssr_gene_intersect'] ? (
            <>
              <Tabs defaultValue="ssr_gene_intersect" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="ssr_gene_intersect" className="text-xs px-2 py-1.5">Intersection Plot</TabsTrigger>
                  <TabsTrigger value="ref_ssr_dist" className="text-xs px-2 py-1.5" disabled={!referenceId}>Ref. SSR Dist.</TabsTrigger>
                </TabsList>
                <TabsContent value="ssr_gene_intersect"><SsrGeneIntersectionPlot queryResult={ssrGeneIntersectResult} /></TabsContent>
                <TabsContent value="ref_ssr_dist">
                  {referenceId ? (
                    <ReferenceSsrDistributionPlot queryResult={ssrGeneIntersectResult} referenceId={referenceId} />
                  ) : (
                    <Alert variant="default">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Reference SSR Distribution</AlertTitle>
                      <AlertDescription>Reference ID not available for this analysis run.</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              {/* SSR-Gene Intersection Data Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SSR-Gene Intersection Data</h3>
                <VirtualDataTable
                  projectId={projectId}
                  plotKey="ssr_gene_intersect"
                  tableName="ssr_gene_intersect"
                  caption="Complete SSR-Gene intersection data from ssr_genecombo table - SSRs that overlap with annotated genes."
                />
              </div>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No SSR-Gene Intersection Data</AlertTitle>
              <AlertDescription>SSR-Gene Intersection data is not available for this project.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="hotspot_data" className="space-y-4">
          {isHotspotLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : isHotspotAvailable && availableTableData['hotspot'] ? (
            <>
              <HotspotPlot queryResult={hotspotResult} />

              <Separator className="my-6" />

              {/* Mutational Hotspots Data Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mutational Hotspots Data</h3>
                <VirtualDataTable
                  projectId={projectId}
                  plotKey="hotspot"
                  tableName="hotspot_data"
                  caption="Complete mutational hotspots data from mutational_hotspots table - SSR loci with high variability across genomes."
                />
              </div>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Hotspot Data</AlertTitle>
              <AlertDescription>Hotspot data is not available for this project.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="hssr_data" className="space-y-4">
          {isHssrDataLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : isHssrDataAvailable && availableTableData['hssr_data'] ? (
            <>
              <Tabs defaultValue="gene_country_sankey" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="gene_country_sankey" className="text-xs px-2 py-1.5">Gene → Optional</TabsTrigger>
                  <TabsTrigger value="temporal_scatter" className="text-xs px-2 py-1.5">Temporal Dist.</TabsTrigger>
                  <TabsTrigger value="ssr_gene_genome_dot" className="text-xs px-2 py-1.5">SSR Dot Plot</TabsTrigger>
                </TabsList>
                <TabsContent value="gene_country_sankey">
                  {isGeneCountrySankeyAvailable && isHssrDataAvailable ? (
                    <GeneCountrySankeyPlot linkDataQueryResult={geneCountrySankeyResult} hotspotDataQueryResult={hssrDataResult} />
                  ) : (isGeneCountrySankeyLoading || isHssrDataLoading) ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Gene → Optional Category Plot</AlertTitle>
                      <AlertDescription>Gene to optional category data not available.</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                <TabsContent value="temporal_scatter"><TemporalFacetedScatterPlot queryResult={hssrDataResult} /></TabsContent>
                <TabsContent value="ssr_gene_genome_dot"><SsrGeneGenomeDotPlot queryResult={hssrDataResult} referenceId={referenceId} /></TabsContent>
              </Tabs>

              <Separator className="my-6" />

              {/* HSSR Analysis Data Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">HSSR Analysis Data</h3>
                <VirtualDataTable
                  projectId={projectId}
                  plotKey="hssr_data"
                  tableName="hssr_data"
                  caption="Complete HSSR analysis data from hssr_data table - homologous SSR pairs and their relationships."
                />
              </div>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No HSSR Data</AlertTitle>
              <AlertDescription>HSSR data is not available for this project.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* All Data Tables Tab */}
        <TabsContent value="data_tables" className="space-y-8">
          {/* Core Data Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Core Analysis Data</h3>
            <VirtualDataTable
              projectId={projectId}
              plotKey="plot_source"
              tableName="core_data"
              caption="Complete core analysis data from merged_out table - all SSR records with genomic positions, motifs, and metadata."
            />
          </div>

          {/* SSR-Gene Intersection Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">SSR-Gene Intersection Data</h3>
            <VirtualDataTable
              projectId={projectId}
              plotKey="ssr_gene_intersect"
              tableName="ssr_gene_intersect"
              caption="Complete SSR-Gene intersection data from ssr_genecombo table - SSRs that overlap with annotated genes."
            />
          </div>

          {/* Hotspot Data Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Mutational Hotspots Data</h3>
            <VirtualDataTable
              projectId={projectId}
              plotKey="hotspot"
              tableName="hotspot_data"
              caption="Complete mutational hotspots data from mutational_hotspots table - SSR loci with high variability across genomes."
            />
          </div>

          {/* HSSR Data Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">HSSR Analysis Data</h3>
            <VirtualDataTable
              projectId={projectId}
              plotKey="hssr_data"
              tableName="hssr_data"
              caption="Complete HSSR analysis data from hssr_data table - homologous SSR pairs and their relationships."
            />
          </div>


        </TabsContent>

        {/* Keep the runs tab for reference */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Runs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <colgroup>
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '120px' }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Genomes</TableHead>
                      <TableHead>SSRs</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs?.map((run, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">#{run.run_id}</TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="truncate" title={run.job_id}>{run.job_id}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="truncate" title={run.reference_genome_id}>{run.reference_genome_id}</div>
                        </TableCell>
                        <TableCell>{run.genomes_used_count?.toLocaleString()}</TableCell>
                        <TableCell>{run.ssrs_total_count?.toLocaleString()}</TableCell>
                        <TableCell>{new Date(run.run_timestamp).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}