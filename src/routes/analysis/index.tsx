import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueries, type UseQueryResult } from '@tanstack/react-query'; // Added useQueries, UseQueryResult
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient
import { tableFromIPC } from "apache-arrow"; // Added Table type
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  getPaginationRowModel,
  getFilteredRowModel, // Added for filtering
  getSortedRowModel, // Added for sorting
  type SortingState, // Added for sorting state
} from '@tanstack/react-table';

// --- Shadcn UI Components ---
import { FlipButton } from "@/components/animate-ui/buttons/flip";
import { LiquidButton } from "@/components/animate-ui/buttons/liquid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added for filter input
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Added Switch import
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/radix/tabs";
import { CopyButton } from "@/components/animate-ui/buttons/copy";
import { FastaFileUpload } from "@/components/ui/FastaFileUpload";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GuideDrawer } from "@/components/GuideDrawer"; // Import the new component
import { ExampleFilesDrawer } from "@/components/ExampleFilesDrawer";

// --- Icons and Animation ---
import { Counter } from '@/components/animate-ui/components/counter';
import {
  AlertCircle, Download, Info, Search,
  GitBranch,
  ChevronUpIcon, ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Filter,
  ChevronDown,
  File as FileIcon, // Renamed File icon
  BookOpen, // Added BookOpen icon
  History, // Added History icon
  Settings2, // Added Settings2 icon
  Sparkles, // Added Sparkles icon
  Database, // Added Database icon
  RotateCcw, // Added for "Reset to Defaults" button
  ExternalLink,
} from "lucide-react";
import { motion } from 'motion/react';
import { WritingText } from "@/components/animate-ui/text/writing"; // Import WritingText
import { Toaster, toast } from 'sonner';
import { cn } from "@/lib/utils"; // Import cn utility
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Custom Plot Components ---
import RelativeAbundancePlot from '@/components/plots/RelativeAbundancePlot';
import RelativeDensityPlot from '@/components/plots/RelativeDensityPlot';
import CategoryCountrySankeyPlot from '@/components/plots/CategoryCountrySankeyPlot';
import GeneCountrySankeyPlot from '@/components/plots/GeneCountrySankeyPlot';
import MotifConservationPlot from '@/components/plots/MotifConservationPlot';
import MotifDistributionHeatmap from '@/components/plots/MotifDistributionHeatmap';
import SsrConservationPlot from '@/components/plots/SsrConservationPlot';
import SsrGcDistributionPlot from '@/components/plots/SsrGcDistributionPlot';
import SsrGeneIntersectionPlot from '@/components/plots/SsrGeneIntersectionPlot';
import HotspotPlot from '@/components/plots/HotspotPlot';
import TemporalFacetedScatterPlot from '@/components/plots/TemporalFacetedScatterPlot';
import ReferenceSsrDistributionPlot from '@/components/plots/ReferenceSsrDistributionPlot'; // Added import
import SsrGeneGenomeDotPlot from '@/components/plots/SsrGeneGenomeDotPlot'; // Import the new plot
import UpsetPlot from '@/components/plots/UpsetPlot'; // Import the UpSet plot component

import { AnalysisBottomNav } from '@/components/AnalysisBottomNav'; // Import the new component
import { ApiStatusBadge, DevStatusBadge } from "@/components/ApiStatusBadge";

// --- Constants ---
/**
 * API_BASE_URL determines the base path for API requests.
 * - In development (import.meta.env.DEV is true), it uses '/api' to leverage Vite's proxy (configured in vite.config.js).
 *   Requests like fetch(`${API_BASE_URL}/analyze_ssr/`) become fetch('/api/analyze_ssr/'), and the proxy forwards them to the backend.
 * - In production, it checks if VITE_CROSSROAD_API_URL is set. If it is, it uses '/api' to ensure requests go through the proxy
 *   set in vite.config.js for preview mode. If not set, it falls back to a default production backend URL.
 */
const API_BASE_URL = import.meta.env.DEV || import.meta.env.VITE_CROSSROAD_API_URL
  ? '/api'
  : 'https://cr.pranjal.work';
const POLLING_INTERVAL = 3000;

// Define keys to fetch - plot_source is used by multiple plots
// Added 'gene_country_sankey' to fetch its specific data
const PLOT_KEYS_TO_FETCH = ['plot_source', 'hssr_data', 'hotspot', 'ssr_gene_intersect', 'gene_country_sankey'] as const;
type PlotKey = typeof PLOT_KEYS_TO_FETCH[number];

// Map plot keys to the actual filenames for the demo job
const DEMO_FILE_MAPPING: Record<PlotKey, string> = {
  'plot_source': 'mergedOut.tsv',
  'hssr_data': 'hssr_data.csv',
  'hotspot': 'mutational_hotspot.csv',
  'ssr_gene_intersect': 'ssr_genecombo.tsv',
  'gene_country_sankey': 'ref_ssr_genecombo.csv'
};

// Type for the result of a single query within useQueries
type PlotDataResult = {
  plotKey: PlotKey;
  data: any[] | null;
  error?: string;
  // Present when the backend capped a very large result file (see MAX_PREVIEW_FILE_BYTES
  // on the API) to a row-limited preview instead of loading/serializing it whole.
  truncated?: boolean;
  totalRows?: number;
  previewRows?: number;
  fileSizeBytes?: number;
};
type PlotQueryResult = UseQueryResult<PlotDataResult, Error>;

// Formats a byte count as a human-readable size string (e.g. "7.8 GB").
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

type JobResultFile = {
  relative_path: string;
  name: string;
  label: string;
  size_bytes: number;
  download_url: string;
  is_primary: boolean;
};

const CLI_GITHUB_URL = 'https://github.com/BioinformaticsOnLine/croSSRoad';
const CLI_CONDA_URL = 'https://anaconda.org/channels/jitendralab/packages/crossroad/overview';
const CLI_INSTALL_CMD = 'mamba install -c jitendralab -c bioconda -c conda-forge crossroad -y';

/** Resolve an API path (/api/job/...) for fetch or window.open in dev vs prod. */
function resolveApiPath(path: string): string {
  if (import.meta.env.DEV || import.meta.env.VITE_CROSSROAD_API_URL) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

/** Jobs above this total primary-file size get direct downloads instead of zip. */
const LARGE_RESULTS_TOTAL_BYTES = 500 * 1024 * 1024;

// TextShine component for loading state
export function TextShine({ text = "Fetching data..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <motion.h1
        className={cn(
          "bg-[linear-gradient(110deg,#bfbfbf,35%,#000,50%,#bfbfbf,75%,#bfbfbf)] dark:bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)]",
          "bg-[length:200%_100%] bg-clip-text text-base font-medium text-transparent",
        )}
        initial={{ backgroundPosition: "200% 0" }}
        animate={{ backgroundPosition: "-200% 0" }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "linear",
        }}
      >
        {text}
      </motion.h1>
      <div className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0.2s" }}></span>
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0.4s" }}></span>
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0.6s" }}></span>
      </div>
    </div>
  );
}

// Add this after the TextShine component and before DataTable
function Loader({ className, text }: { className?: string; text?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-8", className)}>
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-4 border-muted"></div>
        <div className="absolute left-0 top-0 h-24 w-24 animate-spin rounded-full border-4 border-t-primary"></div>
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-muted"></div>
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-t-primary" style={{ animationDirection: "reverse" }}></div>
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-muted"></div>
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-t-primary"></div>
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Skeleton for tab content while loading
function TabContentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Zod Schema Definitions ---
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ACCEPTED_TSV_EXTENSIONS = ['.tsv'];
const ACCEPTED_BED_EXTENSIONS = ['.bed'];

// Helper for file validation schema
const fileSchema = (required: boolean) => {
  const baseSchema = z.instanceof(FileList).refine(
    (files) => files === undefined || files.length === 0 || (files.length === 1 && files[0].size <= MAX_FILE_SIZE),
    `Max file size is 500MB.`
  );
  if (required) {
    return baseSchema
      .refine((files) => files !== undefined && files.length === 1, 'File is required.');
  }
  return baseSchema.optional();
};

// Schema for PERF parameters with defaults for parsing
const perfSchema = z.object({
  mono: z.number().int().min(1).default(12),
  di: z.number().int().min(1).default(6),
  tri: z.number().int().min(1).default(4),
  tetra: z.number().int().min(1).default(3),
  penta: z.number().int().min(1).default(3),
  hexa: z.number().int().min(1).default(2),
  minLen: z.number().int().min(0).default(1000),
  maxLen: z.number().int().min(0).default(10000000),
  max_n_bases: z.number().int().min(0).default(0),
  thread: z.number().int().min(1).default(10),
  min_repeat_count: z.number().int().min(1).default(1),
  min_genome_count: z.number().int().min(1).default(2),
});

// Main form schema
const formSchema = z.object({
  fasta_file: fileSchema(true)
    .refine(files => files && files.length > 0 && /\.(fa|fasta)$/i.test(files[0].name), ".fa or .fasta file expected"),
  categories_file: fileSchema(false).refine(files => files === undefined || files.length === 0 || ACCEPTED_TSV_EXTENSIONS.some(ext => files![0].name.toLowerCase().endsWith(ext)), ".tsv file expected"),
  gene_bed: fileSchema(false).refine(files => files === undefined || files.length === 0 || ACCEPTED_BED_EXTENSIONS.some(ext => files![0].name.toLowerCase().endsWith(ext)), ".bed file expected"),
  reference_id: z.string().optional(),
  flanks: z.boolean(),
  perf_params: perfSchema,
});

type FormValues = z.infer<typeof formSchema>;

// Type Helper for Perf Params
type PerfParams = z.infer<typeof perfSchema>;

// Type for a successful job submission response
type JobSubmissionSuccess = {
  job_id: string;
  status: string;
  message: string;
  status_url: string;
  results_base_url: string;
  download_all_url: string;
};

// Explicit type for default values structure
// File fields keep the full FormValues type (not just `undefined`) so TanStack Form's
// inferred field paths (used by setFieldValue/form.Field) still include them.
type FormDefaultValues = {
  fasta_file: FormValues['fasta_file']; // Defaults to undefined at runtime
  categories_file: FormValues['categories_file'];
  gene_bed: FormValues['gene_bed'];
  reference_id?: string;
  flanks: boolean;
  perf_params: PerfParams; // Use the existing PerfParams type
};

// Descriptions for PERF parameters, used in Popovers
const perfParamDescriptions: Record<keyof PerfParams, string> = {
  mono: "Mononucleotide repeat threshold. Defines the minimum number of consecutive identical bases to be considered a mononucleotide SSR. Default: 12.",
  di: "Dinucleotide repeat threshold. Defines the minimum number of repeating two-base units (e.g., ATATAT) to be considered a dinucleotide SSR. Default: 6.",
  tri: "Trinucleotide repeat threshold. Defines the minimum number of repeating three-base units (e.g., AGCAGCAGC) to be considered a trinucleotide SSR. Default: 4.",
  tetra: "Tetranucleotide repeat threshold. Defines the minimum number of repeating four-base units to be considered a tetranucleotide SSR. Default: 3.",
  penta: "Pentanucleotide repeat threshold. Defines the minimum number of repeating five-base units to be considered a pentanucleotide SSR. Default: 3.",
  hexa: "Hexanucleotide repeat threshold. Defines the minimum number of repeating six-base units to be considered a hexanucleotide SSR. Default: 2.",
  minLen: "Minimum genome length for filtering. Genomes shorter than this value will be excluded from analysis. Default: 1000 bp.",
  maxLen: "Maximum genome length for filtering. Genomes longer than this value will be excluded from analysis. Default: 10,000,000 bp.",
  max_n_bases: "Maximum number of 'N' (unknown) bases allowed per genome. Genomes with more 'N's than this value will be excluded. Default: 0.",
  thread: "Number of threads for parallel processing. Specifies how many CPU cores can be utilized during the analysis. Default: 10.",
  min_repeat_count: "Minimum repeat count for hotspot filtering. SSRs found in fewer genomes than this threshold will be excluded from hotspot analysis. Default: 1.",
  min_genome_count: "Minimum genome count for hotspot filtering. SSRs must be present in at least this many genomes to be considered for hotspot analysis. Default: 2.",
};

// --- Helper Components ---

// Displays validation errors for a form field
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.touchedErrors?.length > 0 ? (
        <em className="text-xs text-red-500 pt-1 block">{field.state.meta.touchedErrors.join(', ')}</em>
      ) : null}
    </>
  );
}


// --- Reusable DataTable Component ---
interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  caption?: string;
  tableName?: string;
}

// Add this helper function before the DataTable component
function formatLociAndLength(loci: string, lengths: string) {
  const lociArray = loci.split(':').map(l => l.trim());
  const lengthsArray = lengths.split(':').map(l => l.trim());

  return lociArray.map((locus, index) => ({
    locus,
    length: lengthsArray[index] || 'N/A'
  }));
}

// Update the DataTable component to handle special columns
function DataTable<TData>({ data, columns, caption, tableName }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data: data,
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
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleDownload = () => {
    const headers = table.getAllColumns()
      .filter(column => column.getIsVisible())
      .map(column => column.id);

    const csvContent = [
      headers.join(','),
      ...table.getFilteredRowModel().rows.map(row =>
        headers.map(header => {
          const value = row.getValue(header);
          const stringValue = value === null || value === undefined ? '' : String(value);
          // Escape double quotes by doubling them and wrap in double quotes
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableName || 'table'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add this before the return statement
  const renderCell = (cell: any) => {
    const columnId = cell.column.id;
    const value = cell.getValue();

    // Special handling for Hotspot table columns
    if (tableName === 'hotspot_data' && (columnId === 'loci' || columnId === 'length_of_ssr')) {
      const otherColumnId = columnId === 'loci' ? 'length_of_ssr' : 'loci';
      const otherValue = cell.row.getValue(otherColumnId);

      if (columnId === 'loci') {
        const formattedData = formatLociAndLength(value, otherValue);

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-auto py-1 px-2 text-xs">
                {value.split(':').length} loci
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-2">
                <h4 className="text-sm font-medium mb-2">Loci Details</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {formattedData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <span className="font-mono">{item.locus}</span>
                        <span className="text-muted-foreground">{item.length}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        );
      }

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-auto py-1 px-2 text-xs">
              {value.split(':').length} lengths
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-2">
              <h4 className="text-sm font-medium mb-2">Length Details</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {formatLociAndLength(otherValue, value).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                      <span className="font-mono">{item.locus}</span>
                      <span className="text-muted-foreground">{item.length}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available for this table.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Global Filter */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter all columns..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm h-8 text-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="mr-2 h-4 w-4" />
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {table.getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Download Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="h-8"
        >
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <div className="overflow-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          {caption && <caption className="caption-bottom p-2 text-xs text-muted-foreground">{caption} (Showing first 10 rows)</caption>}
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center justify-between">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUpIcon className="ml-1 h-4 w-4" />,
                        desc: <ChevronDownIcon className="ml-1 h-4 w-4" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {renderCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between gap-4 py-4 text-sm">
        <div className="flex items-center space-x-2">
          <p className="text-muted-foreground">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[100px] items-center justify-center text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <ChevronFirstIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <ChevronLastIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export const Route = createFileRoute('/analysis/')({
  component: HomePage
});

// Sample job ID for direct demo loading
const DEMO_JOB_ID = "job-demo-001";

function HomePage() {
  // --- State ---
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobUrls, setJobUrls] = useState<{ statusUrl: string; resultsBase: string; downloadAll: string; } | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [submittedReferenceId, setSubmittedReferenceId] = useState<string | null>(null); // State for submitted ref ID
  const [previousJobIdInput, setPreviousJobIdInput] = useState<string>(''); // State for previous job ID input
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const queryClient = useQueryClient(); // Get query client instance

  // Explicitly define default performance parameters
  const defaultPerfParams: PerfParams = {
    mono: 12,
    di: 6,
    tri: 4,
    tetra: 3,
    penta: 3,
    hexa: 2,
    minLen: 1000,
    maxLen: 10000000,
    max_n_bases: 0,
    thread: 10, // Fixed server-side setting; intentionally not exposed/configurable in the UI
    min_repeat_count: 1,
    min_genome_count: 2,
  };

  // --- Form Initialization ---
  // Define the default values with the explicit type
  const defaultFormVals: FormDefaultValues = {
    fasta_file: undefined,
    categories_file: undefined,
    gene_bed: undefined,
    reference_id: '',
    flanks: false,
    perf_params: defaultPerfParams,
  };

  const form = useForm({
    defaultValues: defaultFormVals, // Use the explicitly typed default values
    onSubmit: async ({ value }) => {
      const formData = prepareFormData(value);
      submitMutation.mutate(formData);
    },
  });

  // --- Helper to Prepare FormData ---
  const prepareFormData = (value: FormValues): FormData => {
    const formData = new FormData();
    if (value.fasta_file?.[0]) formData.append('fasta_file', value.fasta_file[0], value.fasta_file[0].name);
    if (value.categories_file?.[0]) formData.append('categories_file', value.categories_file[0], value.categories_file[0].name);
    if (value.gene_bed?.[0]) formData.append('gene_bed', value.gene_bed[0], value.gene_bed[0].name);
    if (value.reference_id) formData.append('reference_id', value.reference_id);
    formData.append('flanks', String(value.flanks ?? false));
    const { max_n_bases, ...restPerfParams } = value.perf_params;
    const backendPerfParams = { ...restPerfParams, unfair: max_n_bases };
    formData.append('perf_params', JSON.stringify(backendPerfParams));
    return formData;
  };

  // --- TanStack Query: Job Submission Mutation ---
  // Network upload only starts here (on Submit). File pickers only read files locally for validation.
  const submitMutation = useMutation({
    mutationFn: (formData: FormData): Promise<JobSubmissionSuccess> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/analyze_ssr/`, true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            // Cap at 99 until the response arrives so the bar doesn't snap back from 100 → null
            const percentComplete = Math.min(99, Math.round((event.loaded / event.total) * 100));
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          setUploadProgress(100);
          if (xhr.status >= 200 && xhr.status < 300) {
            if (xhr.status !== 202) {
              reject(new Error(`Expected status 202, got ${xhr.status}`));
            } else {
              resolve(JSON.parse(xhr.responseText) as JobSubmissionSuccess);
            }
          } else {
            let errorDetail = `HTTP error ${xhr.status}`;
            try {
              const errorJson = JSON.parse(xhr.responseText);
              errorDetail = errorJson.detail || JSON.stringify(errorJson);
            } catch (e) { }
            reject(new Error(`Server error: ${xhr.status} - ${errorDetail}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network request failed'));
        };

        xhr.send(formData);
      });
    },
    onMutate: () => {
      toast.loading("Uploading files and submitting job...", { id: 'job-submission' });
      setJobId(null); setJobUrls(null); setJobStatus(null); setJobMessage(null);
      setJobProgress(null); setJobError(null); setSubmittedReferenceId(null);
      setUploadProgress(0);
    },
    onSuccess: (data: JobSubmissionSuccess) => {
      const newJobId = data.job_id;
      const initialStatus = data.status;
      const initialMessage = `Job submitted, initial status: ${initialStatus}`;
      let newUrls: { statusUrl: string; resultsBase: string; downloadAll: string; } | null = null;

      if (data.status_url && data.results_base_url && data.download_all_url) {
        newUrls = {
          statusUrl: data.status_url,
          resultsBase: data.results_base_url,
          downloadAll: data.download_all_url,
        };
      }

      setJobId(newJobId);
      setJobStatus(initialStatus);
      setJobMessage(initialMessage);
      setJobUrls(newUrls);
      const submittedValues = form.state.values;
      setSubmittedReferenceId(submittedValues.reference_id || null);

      toast.success(`Job ${newJobId} submitted! Initial Status: ${initialStatus}.`, { id: 'job-submission' });

      // Intentionally not calling form.reset() here: the submit button is already
      // disabled while a job is active (see LiquidButton's disabled logic below), so there's
      // no risk of an accidental resubmission. Keeping the values lets the user see exactly what
      // was submitted, and lets a "failed" job be retried/tweaked without re-entering everything.
    },
    onError: (error: any) => {
      toast.error(`Submission failed: ${error.message || 'Unknown error'}`, { id: 'job-submission' });
      setJobError(error.message || 'Submission failed');
      setSubmittedReferenceId(null);
    },
    onSettled: () => {
      // Brief pause at 100% so the bar doesn't vanish mid-animation
      window.setTimeout(() => setUploadProgress(null), 400);
    },
  });


  // --- TanStack Query: Job Status Polling ---
  const { data: statusData, isError: isStatusError, error: statusFetchError } = useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      if (!jobUrls?.statusUrl) return null;
      const url = import.meta.env.DEV ? jobUrls.statusUrl : `${API_BASE_URL}${jobUrls.statusUrl}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status check failed: ${response.status}`);
      return response.json();
    },
    enabled: !!jobId && !!jobUrls?.statusUrl && jobStatus !== 'completed' && jobStatus !== 'failed',
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 for previous job loads, show error immediately
      if (error.message?.includes('404')) {
        // Check if this error came after attempting to load a previous job
        // We might need a separate state flag for this, but let's try without first.
        // If the job ID exists in the input field, assume it was a load attempt.
        if (previousJobIdInput && jobId === previousJobIdInput) {
          toast.error(`Job ID "${jobId}" not found.`, { id: 'job-polling' });
          setJobId(null); // Clear the invalid job ID
          setJobUrls(null);
          setJobStatus(null);
          setJobMessage(null);
          setJobProgress(null);
          setJobError(`Job ID ${jobId} not found.`);
          setPreviousJobIdInput(''); // Clear input
        }
        return false; // Don't retry 404
      }
      return failureCount < 3;
    },
    retryDelay: POLLING_INTERVAL, // Optional: Match retry delay with polling interval
  });

  // --- Effect to Update Local State from Polling Data ---
  useEffect(() => {
    if (statusData && typeof statusData.status !== 'undefined') {
      setJobStatus(statusData.status);
      setJobMessage(statusData.message ?? 'Status updated.');
      setJobProgress(typeof statusData.progress === 'number' ? statusData.progress : null);
      setJobError(statusData.error_details ?? null);

      // Re-verified: Update URLs state using only the URL fields from statusData
      if (statusData.status_url && statusData.results_base_url && statusData.download_all_url) {
        setJobUrls({
          statusUrl: statusData.status_url, // String is expected
          resultsBase: statusData.results_base_url, // String is expected
          downloadAll: statusData.download_all_url, // String is expected
        });
      } // No 'else' here, so URLs persist if not resent

      // Restore reference ID when loading previous jobs
      if (statusData.reference_id) {
        setSubmittedReferenceId(statusData.reference_id);
      }

      // Handle toast notifications based on status changes
      if (statusData.status === 'completed') {
        toast.success(`Job ${jobId} completed!`, { id: 'job-polling' });
        toast.dismiss('job-polling');
      } else if (statusData.status === 'failed') {
        toast.error(`Job ${jobId} failed: ${statusData.error_details || 'Unknown error'}`, { id: 'job-polling' });
        toast.dismiss('job-polling');
      }
    }
  }, [statusData]);

  // --- Effect to handle polling fetch errors ---
  useEffect(() => {
    if (isStatusError && statusFetchError) {
      const errorMsg = (statusFetchError as Error).message || "Polling failed";
      console.error("Polling error:", statusFetchError);
      setJobError(errorMsg);
      setJobStatus('failed');
      toast.error(`Error polling job ${jobId}: ${errorMsg}`, { id: 'job-polling' });
      toast.dismiss('job-polling');
    }
  }, [isStatusError, statusFetchError, jobId]);


  // --- Function to handle loading previous job ---
  const handleLoadPreviousJob = () => {
    const trimmedJobId = previousJobIdInput.trim();
    if (!trimmedJobId) {
      toast.warning("Please enter a Job ID.");
      return;
    }
    if (trimmedJobId === jobId) {
      toast.info(`Job ${trimmedJobId} is already loaded.`);
      return;
    }

    console.log(`Attempting to load previous job: ${trimmedJobId}`);
    toast.info(`Loading results for job ${trimmedJobId}...`, { id: 'job-load' });

    // Clear existing job state and query cache for the old job ID (if any)
    queryClient.removeQueries({ queryKey: ['jobStatus', jobId], exact: true });
    queryClient.removeQueries({ queryKey: ['plotData', jobId], exact: true });
    setJobId(null);
    setJobUrls(null);
    setJobStatus(null);
    setJobMessage(null);
    setJobProgress(null);
    setJobError(null);
    // Removed clearing previous reference ID to preserve it when loading previous job

    // Construct URLs for the *new* (previous) job ID
    const newUrls = {
      statusUrl: `/api/job/${trimmedJobId}/status`,
      resultsBase: `/api/job/${trimmedJobId}/plot_data/`,
      downloadAll: `/api/job/${trimmedJobId}/download_zip`,
    };

    // Set the new job ID and URLs - this will trigger the queries
    setJobId(trimmedJobId);
    setJobUrls(newUrls);
    setJobStatus('loading'); // Set an intermediate status
    setJobMessage(`Fetching status for job ${trimmedJobId}...`);

    // Clear the input field *after* setting the job ID
    // setPreviousJobIdInput(''); // Or keep it populated? Let's keep it for now.
  };

  // --- Function to load demo job results ---
  const handleLoadDemoJob = () => {
    // Use a predefined demo job ID
    const demoJobId = DEMO_JOB_ID;

    console.log(`Loading demo job: ${demoJobId}`);
    toast.info(`Loading demo analysis...`, { id: 'demo-load' });

    // Clear existing job state and query cache
    queryClient.removeQueries({ queryKey: ['jobStatus', jobId], exact: true });
    queryClient.removeQueries({ queryKey: ['plotData', jobId], exact: true });
    setJobId(null);
    setJobUrls(null);
    setJobStatus(null);
    setJobMessage(null);
    setJobProgress(null);
    setJobError(null);

    // For demo, use the sample files in public/sample/jobOut
    // Use absolute paths from the web root
    const newUrls = {
      statusUrl: `/sample/jobOut/status.json`,
      resultsBase: `/sample/jobOut/`,
      downloadAll: `/sample/jobOut/`,
    };

    console.log("Demo URLs set to:", newUrls);

    // Set job ID and URLs to trigger the queries
    setJobId(demoJobId);
    setJobUrls(newUrls);
    setJobStatus('completed'); // Set directly to completed
    setJobMessage(`Loaded demo analysis.`);
    setSubmittedReferenceId("NC_063383.1"); // Set from status.json

    toast.success("Demo analysis loaded successfully!", { id: 'demo-load' });
  };

  // --- Function to load example data ---
  const handleLoadExample = async (exampleName: string) => {
    // Reset form state and show loading toast
    form.reset();

    if (exampleName !== 'monkeypox') {
      toast.info(`Loading ${exampleName} example...`, { id: 'load-example' });
    } else {
      toast.info("Loading example dataset...", { id: 'load-example' });
    }

    // Short delay to allow toast to show
    await new Promise(r => setTimeout(r, 500));

    try {
      const filePaths = {
        fasta: '/sample/1.fa',
        bed: '/sample/2.bed',
        tsv: '/sample/3.tsv',
      };

      // Fetch files concurrently
      const [fastaRes, bedRes, tsvRes] = await Promise.all([
        fetch(filePaths.fasta),
        fetch(filePaths.bed),
        fetch(filePaths.tsv),
      ]);

      if (!fastaRes.ok) throw new Error(`Failed to fetch ${filePaths.fasta}: ${fastaRes.statusText}`);
      // Optional files might not exist or fail, handle gracefully
      const bedOk = bedRes.ok;
      const tsvOk = tsvRes.ok;

      const fastaBlob = await fastaRes.blob();
      const bedBlob = bedOk ? await bedRes.blob() : null;
      const tsvBlob = tsvOk ? await tsvRes.blob() : null;

      // Create File objects
      const fastaFile = new File([fastaBlob], '1.fa', { type: fastaBlob.type });
      const bedFile = bedBlob ? new File([bedBlob], '2.bed', { type: bedBlob.type }) : null;
      const tsvFile = tsvBlob ? new File([tsvBlob], '3.tsv', { type: tsvBlob.type }) : null;

      // Create FileList objects using DataTransfer
      const createFileList = (file: File | null): FileList | undefined => {
        if (!file) return undefined;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        return dataTransfer.files;
      };

      const fastaFileList = createFileList(fastaFile);
      const bedFileList = createFileList(bedFile);
      const tsvFileList = createFileList(tsvFile);

      // Update form state
      if (fastaFileList) form.setFieldValue('fasta_file', fastaFileList);
      form.setFieldValue('gene_bed', bedFileList); // Set to undefined if null
      form.setFieldValue('categories_file', tsvFileList); // Set to undefined if null

      // Optionally clear other fields or set defaults if needed
      form.setFieldValue('reference_id', ''); // Clear reference ID for example
      form.setFieldValue('flanks', false); // Reset flanks
      form.setFieldValue('perf_params', defaultPerfParams); // Reset perf params

      toast.success("Example data loaded!", { id: 'load-example' });

      // Explicitly trigger validation after setting fields
      form.validateAllFields('change');
    } catch (error: any) {
      console.error("Error loading example data:", error);
      toast.error(`Failed to load example data: ${error.message}`, { id: 'load-example' });
    }
  };
  // --- List result files first (fast) so we can skip plot fetches for multi-GB jobs ---
  const { data: jobFilesData, isLoading: isJobFilesLoading } = useQuery({
    queryKey: ['jobFiles', jobId],
    queryFn: async (): Promise<{ job_id: string; files: JobResultFile[] }> => {
      const resp = await fetch(resolveApiPath(`/api/job/${jobId}/files`));
      if (!resp.ok) throw new Error(`Failed to list result files (${resp.status})`);
      return resp.json();
    },
    enabled: jobStatus === 'completed' && !!jobId && jobId !== DEMO_JOB_ID,
    staleTime: Infinity,
  });

  const primaryResultFiles = useMemo(
    () => jobFilesData?.files.filter((f) => f.is_primary) ?? [],
    [jobFilesData],
  );

  const isLargeResultsJob = useMemo(() => {
    if (jobId === DEMO_JOB_ID) return false;
    if (!jobFilesData?.files) return false;
    if (primaryResultFiles.some((f) => f.size_bytes > 100 * 1024 * 1024)) return true;
    const totalPrimaryBytes = primaryResultFiles.reduce((sum, f) => sum + f.size_bytes, 0);
    return totalPrimaryBytes > LARGE_RESULTS_TOTAL_BYTES;
  }, [jobId, jobFilesData, primaryResultFiles]);

  // Wait for file listing before fetching plot data (except demo). Skip entirely for large jobs.
  const canFetchPlotData =
    jobStatus === 'completed' &&
    !!jobUrls?.resultsBase &&
    (jobId === DEMO_JOB_ID || (jobFilesData !== undefined && !isLargeResultsJob));

  // --- Fetch Multiple Table Data via Arrow using useQueries ---
  const plotDataQueries = useQueries({
    queries: PLOT_KEYS_TO_FETCH.map((plotKey) => ({
      queryKey: ['plotData', jobId, plotKey],
      queryFn: async (): Promise<PlotDataResult> => {
        if (!jobStatus || jobStatus !== 'completed' || !jobUrls?.resultsBase) {
          return { plotKey, data: null }; // Return null if prerequisites not met
        }

        // For the demo job, use direct path without API_BASE_URL and use the correct filename
        const isDemo = jobId === DEMO_JOB_ID;
        let url: string;
        if (isDemo) {
          url = `${jobUrls.resultsBase}${DEMO_FILE_MAPPING[plotKey]}`;
        } else {
          url = import.meta.env.DEV
            ? `${jobUrls.resultsBase}${plotKey}` // In dev, jobUrls.resultsBase already has /api, Vite handles it
            : `${API_BASE_URL}${jobUrls.resultsBase}${plotKey}`; // In prod, prepend full API_BASE_URL
        }

        console.log(`Fetching ${plotKey} from ${url}`);

        try {
          const resp = await fetch(url);
          if (resp.status === 204) { // Handle No Content
            return { plotKey, data: [] }; // Empty array signifies no data
          }
          if (!resp.ok) {
            throw new Error(`Status ${resp.status}`);
          }

          // For demo job, we need to parse CSV/TSV files instead of arrow binary format
          if (isDemo) {
            const text = await resp.text();
            if (!text || text.trim() === '') {
              return { plotKey, data: [] }; // Empty text means no data
            }

            // Determine delimiter based on file extension
            const isCSV = url.endsWith('.csv');
            const delimiter = isCSV ? ',' : '\t';

            // Special handling for ssr_genecombo.tsv which has a problematic format
            if (plotKey === 'ssr_gene_intersect' || plotKey === 'gene_country_sankey') {
              // Clean up the file content
              const cleanedText = text
                .replace(/\r\n/g, '\n')  // Normalize line endings
                .replace(/\n\s+/g, ' ')  // Replace newlines with spaces if they're in the middle of data
                .replace(/\s{2,}/g, ' '); // Reduce multiple spaces to single spaces

              // Re-split into proper lines
              const lines = cleanedText.split('\n').filter(line => line.trim() !== '');

              // Handle header - in these files, header columns are the important ones
              const headers = lines[0].split(delimiter).map(h => h.trim());

              // Create a structured object for each row
              const data = [];
              for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter).map(v => v.trim());
                const row: { [key: string]: any } = {};

                // Map values to headers, ensuring no undefined values
                headers.forEach((header, index) => {
                  row[header] = (index < values.length) ? values[index] : '';
                });

                // Ensure required fields exist based on the plot type
                if (plotKey === 'ssr_gene_intersect' && row['gene'] && row['ssr_position']) {
                  data.push(row);
                }
                else if (plotKey === 'gene_country_sankey' && row['gene'] && row['country']) {
                  data.push(row);
                }
                else if (plotKey !== 'ssr_gene_intersect' && plotKey !== 'gene_country_sankey') {
                  data.push(row);
                }
              }

              return { plotKey, data };
            }

            // Standard parsing for other files
            const lines = text.trim().split('\n');
            const headers = lines[0].split(delimiter).map(h => h.trim());

            // Parse data rows
            const data = lines.slice(1).map(line => {
              const values = line.split(delimiter);
              const row: { [key: string]: any } = {};
              headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
              });
              return row;
            });

            return { plotKey, data };
          }

          // Backend caps very large result files to a row-limited preview rather than
          // loading/serializing them whole (see MAX_PREVIEW_FILE_BYTES on the API).
          const truncated = resp.headers.get('X-Data-Truncated') === 'true';
          const totalRowsHeader = resp.headers.get('X-Data-Total-Rows');
          const previewRowsHeader = resp.headers.get('X-Data-Preview-Rows');
          const fileSizeHeader = resp.headers.get('X-Data-File-Size-Bytes');

          // For regular jobs, continue with Arrow format
          const buffer = await resp.arrayBuffer();
          if (buffer.byteLength === 0) {
            return { plotKey, data: [] }; // Empty buffer means no data
          }
          const arrowTable = tableFromIPC(buffer);
          // Convert BigInts to strings for display if necessary
          const data = arrowTable.toArray().map(row => {
            const newRow: { [key: string]: any } = {};
            for (const key in row) {
              newRow[key] = typeof row[key] === 'bigint' ? row[key].toString() : row[key];
            }
            return newRow;
          });
          return {
            plotKey,
            data,
            truncated,
            totalRows: totalRowsHeader ? Number(totalRowsHeader) : undefined,
            previewRows: previewRowsHeader ? Number(previewRowsHeader) : data.length,
            fileSizeBytes: fileSizeHeader ? Number(fileSizeHeader) : undefined,
          };
        } catch (error: any) {
          console.error(`Failed to fetch or parse data for ${plotKey}:`, error);
          return { plotKey, data: null, error: error.message || 'Fetch/Parse Error' };
        }
      },
      enabled: canFetchPlotData,
      staleTime: Infinity, // Data for completed jobs doesn't change
      // Add the select function only for the 'plot_source' key
      // select: plotKey === 'plot_source' ? selectRelativeAbundanceData : undefined, // Removed select
      retry: (failureCount: number, error: any) => {
        // Don't retry on 404 (Not Found) or 204 (No Content implicitly handled)
        if (error?.message?.includes('404')) return false;
        return failureCount < 2; // Retry twice on other errors
      },
    })),
  });

  // Process query results into a map for easy access
  const queryResultsMap = plotDataQueries.reduce((acc, result, index) => {
    const plotKey = PLOT_KEYS_TO_FETCH[index];
    acc[plotKey] = result;
    return acc;
  }, {} as Record<PlotKey, PlotQueryResult>); // Use PlotQueryResult type

  // Generate columns for tables dynamically based on fetched data
  const availableTableData = useMemo(() => {
    return PLOT_KEYS_TO_FETCH.reduce((acc, key) => {
      const result = queryResultsMap[key];
      if (result.isSuccess && result.data?.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
        const data = result.data.data;
        const columns = Object.keys(data[0]).map(colKey => ({
          accessorKey: colKey,
          header: colKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        }));
        acc[key] = { data, columns };
      }
      return acc;
    }, {} as Record<PlotKey, { data: any[]; columns: ColumnDef<any>[] }>);
  }, [queryResultsMap]); // Recompute when query results change



  // Determine if any plot data is available or loading
  const plotSourceResult = queryResultsMap['plot_source'];
  const geneCountrySankeyResult = queryResultsMap['gene_country_sankey'];
  const ssrGeneIntersectResult = queryResultsMap['ssr_gene_intersect'];
  const hotspotResult = queryResultsMap['hotspot'];
  // Need hssr_data result for its table/plot section
  const hssrDataResult = queryResultsMap['hssr_data'];


  // Check if the base data for most plots is loading/available
  const isPlotSourceLoading = plotSourceResult?.isLoading;
  const isPlotSourceAvailable = plotSourceResult?.isSuccess && plotSourceResult?.data?.data && plotSourceResult.data.data.length > 0;

  // Check if the specific data for GeneCountrySankey is loading/available
  const isGeneCountrySankeyLoading = geneCountrySankeyResult?.isLoading;
  const isGeneCountrySankeyAvailable = geneCountrySankeyResult?.isSuccess && geneCountrySankeyResult?.data?.data && geneCountrySankeyResult.data.data.length > 0;

  // Check if the specific data for SsrGeneIntersection is loading/available
  const isSsrGeneIntersectLoading = ssrGeneIntersectResult?.isLoading;
  const isSsrGeneIntersectAvailable = ssrGeneIntersectResult?.isSuccess && ssrGeneIntersectResult?.data?.data && ssrGeneIntersectResult.data.data.length > 0;

  // Check if the specific data for Hotspot is loading/available
  const isHotspotLoading = hotspotResult?.isLoading;
  const isHotspotAvailable = hotspotResult?.isSuccess && hotspotResult?.data?.data && hotspotResult.data.data.length > 0;

  // Check if hssr_data is loading/available (for Gene->Country Sankey section)
  const isHssrDataLoading = hssrDataResult?.isLoading;
  const isHssrDataAvailable = hssrDataResult?.isSuccess && hssrDataResult?.data?.data && hssrDataResult.data.data.length > 0;

  // Determine if *any* results (tables or plots) can be shown
  const isAnyResultAvailable = isPlotSourceAvailable || isGeneCountrySankeyAvailable || isSsrGeneIntersectAvailable || isHotspotAvailable || isHssrDataAvailable;
  // Determine if *any* data is still loading
  const isAnyDataLoading = isPlotSourceLoading || isGeneCountrySankeyLoading || isSsrGeneIntersectLoading || isHotspotLoading || isHssrDataLoading;


  // --- Render ---
  return (
    <div className="px-4 md:px-6 pt-12 md:pt-16 lg:pt-20 pb-8 md:pb-10 lg:pb-12"> {/* Increased top padding, kept bottom padding */}
      <Toaster richColors position="top-center" />

      {/* --- Header --- */}
      {/* Removed the "Current File" heading */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 md:flex md:items-start md:justify-between" // Changed to items-start for better alignment with multi-line left content
      >
        <div className="md:w-2/5 text-center md:text-left mb-6 md:mb-0"> {/* Left part - made smaller */}
          <h1 className="font-bold tracking-tighter text-3xl sm:text-4xl md:text-4xl lg:text-5xl"> {/* Adjusted font size slightly */}
            cro<span className="bg-gradient-to-r from-primary via-primary/75 to-primary/50 bg-clip-text text-transparent">SSR</span>road
          </h1>
          <h2 className="text-xl text-primary sm:text-2xl md:text-2xl lg:text-3xl font-semibold mt-1">
            <WritingText
              text="SSR Analysis Pipeline"
              spacing={9}
              transition={{ duration: 1, delay: 0.1 }}
            />
          </h2>
        </div>
        <div className="md:w-3/5 text-center md:text-left md:pl-8"> {/* Right part - adjusted width and padding */}
          <WritingText
            text="Analyze Simple Sequence Repeats (SSRs), compare across genomes, identify hotspots, and trace evolutionary patterns."
            className="max-w-[700px] text-foreground font-bold text-sm md:text-base lg:text-lg leading-relaxed"
            transition={{ duration: 1, delay: 0.1 }} // Adjust transition as needed
            spacing={4} // Adjust spacing between words
          />
        </div>
      </motion.div>

      {/* --- System Status --- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8 flex flex-wrap gap-2 items-center justify-center md:justify-start"
      >
        <ApiStatusBadge />
        <DevStatusBadge />
      </motion.div>

      {/* --- Form & Guide Section (Two Columns) --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" // Changed to 3 columns for better layout
      >
        {/* --- Left Column: New Analysis Form --- */}
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="lg:col-span-2 space-y-6"> {/* Form spans 2 columns */}
          <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">New Analysis</h2>

          {/* File Inputs Card */}
          <Card className="backdrop-blur-md bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-900/30 dark:via-gray-950 dark:to-green-900/30 border border-gray-200/60 dark:border-gray-800/60 shadow-sm rounded-xl">
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-medium flex items-center">
                  <FileIcon className="mr-2 h-5 w-5" /> Upload Your Data
                </CardTitle>
                <CardDescription>
                  Provide the required FASTA file and optional metadata.
                </CardDescription>
              </div>
              <ExampleFilesDrawer
                onLoadExample={handleLoadExample}
                onLoadDemo={handleLoadDemoJob}
              >
                <FlipButton
                  frontText="How to Format?"
                  backText="See Examples"
                  className="w-full sm:w-auto px-6 rounded-full"
                  frontClassName="bg-emerald-600 text-white dark:bg-emerald-500 font-bold rounded-full"
                  backClassName="bg-white text-emerald-600 border-2 border-emerald-600 dark:bg-gray-900 dark:text-emerald-400 dark:border-emerald-500 font-bold rounded-full"
                />
              </ExampleFilesDrawer>
            </CardHeader>
            <CardContent className="space-y-3 py-3"> {/* Reduced vertical padding and space between items */}
              {/* FASTA File */}
              <form.Field name="fasta_file">{(field) => (
                <div className="space-y-1"> {/* Reduced space */}
                  <Label htmlFor={field.name} className="text-xs font-medium text-gray-700 dark:text-gray-300">FASTA File <span className="text-red-500">*</span></Label>
                  <FastaFileUpload
                    onChange={(files) => {
                      if (files) {
                        const dataTransfer = new DataTransfer();
                        files.forEach(f => dataTransfer.items.add(f));
                        field.handleChange(dataTransfer.files);
                      } else {
                        field.handleChange(undefined);
                      }
                    }}
                    onGenomeCountChange={(count: number) => {
                      console.log("Final genome count:", count);
                    }}
                    accept=".fa,.fasta"
                    required={true}
                    title="Select FASTA File"
                    description="Provide your genomic sequences (sent only on Submit)"
                    fileTypeHint="fasta"
                  />
                  <FieldInfo field={field} />
                </div>
              )}</form.Field>

              {/* Optional Files in a Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1"> {/* Reduced gap and padding-top */}
                {/* Categories File */}
                <form.Field name="categories_file">{(field) => (
                  <div className="space-y-1"> {/* Reduced space */}
                    <Label htmlFor={field.name} className="text-xs font-medium text-gray-700 dark:text-gray-300">Categories File <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                    <FileUpload
                      onChange={(files) => {
                        const dataTransfer = new DataTransfer();
                        if (files && files.length > 0) {
                          files.forEach(file => dataTransfer.items.add(file));
                        }
                        field.handleChange(dataTransfer.files.length > 0 ? dataTransfer.files : undefined);
                      }}
                      accept={ACCEPTED_TSV_EXTENSIONS.join(',')}
                      required={false}
                      title="Categories File (.tsv)"
                      description="Optional metadata"
                      fileTypeHint="tsv"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}</form.Field>

                {/* Gene BED File */}
                <form.Field name="gene_bed">{(field) => (
                  <div className="space-y-1"> {/* Reduced space */}
                    <Label htmlFor={field.name} className="text-xs font-medium text-gray-700 dark:text-gray-300">Gene BED File <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                    <FileUpload
                      onChange={(files) => {
                        const dataTransfer = new DataTransfer();
                        if (files && files.length > 0) {
                          files.forEach(file => dataTransfer.items.add(file));
                        }
                        field.handleChange(dataTransfer.files.length > 0 ? dataTransfer.files : undefined);
                      }}
                      accept={ACCEPTED_BED_EXTENSIONS.join(',')}
                      required={false}
                      title="Gene BED File (.bed)"
                      description="Optional annotations"
                      fileTypeHint="bed"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}</form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Other Options Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="backdrop-blur-md bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-900/30 dark:via-gray-950 dark:to-purple-900/30 border border-gray-200/60 dark:border-gray-800/60 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center"><Settings2 className="mr-2 h-5 w-5" /> Analysis Configuration</CardTitle>
                <CardDescription>Fine-tune analysis parameters for SSR identification and filtering.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reference ID */}
                  <form.Field name="reference_id">{(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference ID <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                      <p className="text-xs text-muted-foreground">ID from your FASTA file for reference-specific plots (e.g., gene distribution).</p>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., NC_063383.1"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}</form.Field>

                  {/* Flanks Toggle */}
                  <form.Field name="flanks">{(field) => (
                    <div className="flex items-center justify-between p-3 border border-gray-200/80 dark:border-gray-800/70 rounded-lg bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all hover:border-primary/40 h-full">
                      <div className="space-y-0.5">
                        <Label htmlFor={field.name} className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          Include Flanking Regions
                          <Badge variant="outline" className="ml-2">Beta</Badge>
                        </Label>
                        <p className="text-xs text-muted-foreground">Analyze regions surrounding SSRs for conservation. Toggle coming soon.</p>
                      </div>
                      <Switch
                        id={field.name}
                        aria-label="Toggle flanking regions"
                        checked={field.state.value}
                        onCheckedChange={(checked: boolean) => field.handleChange(checked)}
                        disabled
                      />
                    </div>
                  )}</form.Field>
                </div>


                {/* PERF Parameters Accordion */}
                <Accordion type="single" collapsible className="w-full" defaultValue="perf-params">
                  <AccordionItem value="perf-params" className="border border-gray-200/80 dark:border-gray-800/70 rounded-lg overflow-hidden bg-gray-50/30 dark:bg-gray-900/30">
                    <AccordionTrigger className="px-4 py-2.5 text-sm font-medium hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        <span>Custom Advanced Parameters (PERF)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-4 pb-4 border-t border-gray-200/80 dark:border-gray-800/70 bg-white/50 dark:bg-gray-950/50">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <p className="text-xs text-muted-foreground">
                          Set the minimum repeat counts for different SSR motif types (mono-, di-, tri-nucleotides, etc.). These values determine which sequences are identified as SSRs.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 text-xs"
                          onClick={() => form.setFieldValue('perf_params', defaultPerfParams)}
                        >
                          <RotateCcw className="mr-1.5 h-3 w-3" /> Reset to Defaults
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
                        {(Object.keys(defaultPerfParams) as Array<keyof PerfParams>)
                          .filter((key) => key !== 'thread') // Thread count is a fixed server-side setting, not user-configurable
                          .map((key) => (
                          <form.Field key={key} name={`perf_params.${key}`}>
                            {(field) => (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-1.5">
                                  <Label htmlFor={field.name} className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                                    {key.replace(/_/g, ' ')}
                                  </Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary rounded-full">
                                        <Info className="h-3 w-3" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-64 bg-blue-50 dark:bg-blue-800 border-blue-200 dark:border-blue-700 p-3 shadow-lg rounded-md"
                                      side="top"
                                      align="center"
                                    >
                                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-200">
                                        {perfParamDescriptions[key as keyof PerfParams] || "No description available."}
                                      </p>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <Counter
                                  number={Number(field.state.value) || 0}
                                  setNumber={(num) => field.handleChange(num)}
                                  buttonProps={{ className: 'h-7 w-7 text-lg' }}
                                  slidingNumberProps={{ className: 'text-base font-medium' }}
                                />
                                <FieldInfo field={field} />
                              </div>
                            )}
                          </form.Field>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </form>

        {/* --- Right Column: Guide & Load Job --- */}
        <div className="lg:col-span-1 space-y-6 sticky top-20"> {/* Sticky positioning */}
          {/* Guide Banner */}
          <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-900/30 dark:via-gray-950 dark:to-blue-900/30 border border-blue-200/60 dark:border-blue-800/60 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center text-blue-800 dark:text-blue-300"><Info className="mr-2 h-5 w-5" /> Quick Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
              <p>1. Upload your <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-xs">.fasta</code> file (required).</p>
              <p>2. Optionally, provide <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-xs">.tsv</code> categories or <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-xs">.bed</code> gene annotations.</p>
              <p>3. Set a Reference ID if you need reference-specific visualizations.</p>
              <p>4. Adjust advanced parameters if needed, or use the defaults.</p>
              <p>5. Click "Submit Job"!</p>
            </CardContent>
            <CardFooter>
              {/* Tutorial link */}
              <GuideDrawer>
                <Button variant="outline" size="sm" className="w-full border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/50">
                  <BookOpen className="mr-2 h-4 w-4" /> View Full Tutorial
                </Button>
              </GuideDrawer>
            </CardFooter>
          </Card>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isValid, state.isValidating]}>
            {([canSubmit, isValid, isValidating]) => {
              const isUploading = uploadProgress !== null;
              const buttonText = () => {
                if (isUploading && uploadProgress < 100) return "Uploading files...";
                if (submitMutation.isPending || isValidating) return "Submitting...";
                if (jobStatus === 'completed') return "Job Completed";
                if (jobStatus === 'running') return "Job Running...";
                if (jobStatus === 'failed') return "Job Failed, Resubmit?";
                return "Submit Job";
              };

              const showLoader = submitMutation.isPending || isValidating || jobStatus === 'running' || isUploading;

              return (
                <div className="space-y-4">
                  <LiquidButton
                    onClick={() => form.handleSubmit()}
                    disabled={!isValid || !canSubmit || submitMutation.isPending || isValidating || (!!jobId && jobStatus !== 'failed')}
                    className="w-full"
                    size="lg"
                    variant="invert"
                  >
                    {showLoader ? (
                      <div className="flex items-center justify-center">
                        <Loader text={buttonText()} className="scale-50" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        {buttonText()} <Sparkles className="ml-2 h-5 w-5" />
                      </div>
                    )}
                  </LiquidButton>

                  {isUploading && (
                    <div className="space-y-1.5 rounded-lg border bg-muted/40 px-3 py-2.5">
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Uploading files to server</span>
                        <span className="tabular-nums">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress ?? 0} className="h-2" />
                    </div>
                  )}

                  {jobId && (
                    <div className="text-center bg-muted/50 p-3 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Last Submitted Job ID</Label>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <code className="font-mono text-sm bg-background px-2 py-1 rounded-md shadow-inner">{jobId}</code>
                        <CopyButton content={jobId} size="sm" variant="ghost" />
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          </form.Subscribe>

          {/* Load Previous Job */}
          <Card className="backdrop-blur-md bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900/30 dark:via-gray-950 dark:to-slate-900/30 border border-gray-200/60 dark:border-gray-800/60 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center"><History className="mr-2 h-5 w-5" /> Load Previous Job</CardTitle>
              <CardDescription>Enter a Job ID to retrieve past results or try a demo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <Label htmlFor="previous-job-id" className="sr-only">Previous Job ID</Label>
                <Input
                  id="previous-job-id"
                  placeholder="Enter Job ID..."
                  value={previousJobIdInput}
                  onChange={(e) => setPreviousJobIdInput(e.target.value)}
                  className="flex-grow border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-all hover:border-primary/40 rounded-md h-9 text-sm shadow-inner"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLoadPreviousJob(); }}
                />
                <Button
                  onClick={handleLoadDemoJob}
                  disabled={submitMutation.isPending || (jobId === DEMO_JOB_ID && jobStatus === 'completed')}
                  variant="secondary"
                  className="rounded-md px-4 py-2 text-sm font-medium shadow-sm"
                >
                  <Database className="mr-1.5 h-4 w-4" /> Load Demo Analysis
                </Button>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  onClick={handleLoadPreviousJob}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-400 font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Load Previous Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* --- Job Status & Results Section --- */}
      {jobId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-16"> {/* Added more top margin */}
          <Card className="border border-gray-200/60 dark:border-gray-800/60 shadow-lg rounded-xl overflow-hidden"> {/* Enhanced card styling */}
            <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200/60 dark:border-gray-800/60 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Job Status</CardTitle>
                <Badge variant={jobStatus === 'completed' ? 'default' : jobStatus === 'failed' ? 'destructive' : 'secondary'}>{jobStatus || 'Initializing...'}</Badge>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <code className="font-mono text-base break-all bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{jobId}</code>
                <CopyButton content={jobId} size="sm" variant="outline" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SLURM / HPC Info Box */}
              {(jobStatus === 'queued' || jobStatus === 'running') && (
                <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-800 dark:text-blue-300 font-bold">HPC Job Submitted</AlertTitle>
                  <AlertDescription className="text-blue-700/80 dark:text-blue-400/80 text-sm">
                    Your analysis is processing on our high-performance cluster. Depending on the data size, this can take a few minutes to a few hours.
                    <div className="mt-2 font-medium bg-blue-100/50 dark:bg-blue-950/40 p-2 rounded border border-blue-200/50 dark:border-blue-800/50 italic">
                      "You can close this tab and come back later. Just copy your Job ID and use the 'Load Previous Job' section below to see your results."
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Progress Bar and Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">{jobMessage || (jobId ? 'Fetching status...' : 'Waiting for status...')}</p>
                  {jobStatus === 'queued' && (
                    <Badge variant="outline" className="text-[10px] uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">Slurm: PENDING</Badge>
                  )}
                  {jobStatus === 'running' && (
                    <Badge variant="outline" className="text-[10px] uppercase bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 animate-pulse">Slurm: RUNNING</Badge>
                  )}
                </div>
                {(jobStatus === 'running' || jobStatus === 'queued') && jobProgress !== null && (<Progress value={jobProgress * 100} className="w-full h-2 shadow-inner" />)}
              </div>

              {/* Status Legend - Only show while job is active */}
              {(jobStatus === 'queued' || jobStatus === 'running') && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase opacity-70">Queued</span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">Waiting in queue</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase opacity-70">Running</span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">Processing on HPC</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase opacity-70">Completed</span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">Results available</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase opacity-70">Failed</span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">Process interrupted</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Error Display */}
              {jobStatus === 'failed' && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Job Failed</AlertTitle><AlertDescription>{jobError || 'Unknown error'}</AlertDescription></Alert>)}
              {/* Results Controls */}
              {jobStatus === 'completed' && jobUrls && (
                <div className="space-y-4 pt-4">
                  <Separator />
                  <p className="font-semibold text-lg">Results</p>

                  {/* Small jobs: quick zip download. Large jobs: direct per-file downloads + CLI guidance. */}
                  {!isLargeResultsJob && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => jobUrls?.downloadAll && window.open(
                        resolveApiPath(jobUrls.downloadAll),
                        '_blank',
                      )}
                      disabled={!jobUrls?.downloadAll}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download Full Results (.zip)
                    </Button>
                  )}

                  {isLargeResultsJob && (
                    <Alert className="bg-blue-50/60 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300 font-bold">
                        Large result set — use direct downloads or the CLI
                      </AlertTitle>
                      <AlertDescription className="text-blue-700/90 dark:text-blue-400/90 text-sm space-y-2">
                        <p>
                          This job produced very large tables (multi-GB). Zipping the entire output folder can take a long time
                          and may fail in the browser. Download individual files below, or use the{' '}
                          <span className="font-medium">croSSRoad CLI</span> for full local analysis and plotting.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                            <a href={CLI_GITHUB_URL} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-1.5 h-3 w-3" /> GitHub CLI
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                            <a href={CLI_CONDA_URL} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-1.5 h-3 w-3" /> Conda package
                            </a>
                          </Button>
                        </div>
                        <p className="text-xs font-mono bg-blue-100/50 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-200/50 dark:border-blue-800/50">
                          {CLI_INSTALL_CMD}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Per-file downloads with sizes */}
                  {jobId !== DEMO_JOB_ID && (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <p className="text-sm font-medium">Result files</p>
                      {isJobFilesLoading ? (
                        <p className="text-xs text-muted-foreground">Loading file list…</p>
                      ) : primaryResultFiles.length > 0 ? (
                        <ul className="space-y-2">
                          {primaryResultFiles.map((file) => (
                            <li
                              key={file.relative_path}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border bg-background px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{file.label}</p>
                                <p className="text-xs text-muted-foreground font-mono truncate">{file.name}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                                  {formatBytes(file.size_bytes)}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => window.open(resolveApiPath(file.download_url), '_blank')}
                                >
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  Download
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">No result files found.</p>
                      )}
                      {!isLargeResultsJob && primaryResultFiles.length > 0 && (
                        <p className="text-xs text-muted-foreground pt-1">
                          Or use the zip above to download all output files at once.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Truncated-preview warning removed for large jobs — plots/tables are not loaded at all. */}

                  {/* --- Results Structure with Tabs (small jobs only) --- */}
                  <div className="mt-6 space-y-8">
                    {isJobFilesLoading && jobId !== DEMO_JOB_ID && (
                      <div className="flex justify-center py-4">
                        <TextShine text="Checking result file sizes…" />
                      </div>
                    )}

                    {isLargeResultsJob && (
                      <Alert className="bg-muted/50 border-dashed">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Interactive plots unavailable in browser</AlertTitle>
                        <AlertDescription className="text-sm">
                          Result files are too large for in-browser tables and plots. Download the CSV/TSV files above
                          or use the croSSRoad CLI to explore and visualize the full dataset locally.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!isLargeResultsJob && (
                      <>
                    {/* Catchy phrase while loading */}
                    {isAnyDataLoading && (
                      <div className="flex justify-center py-8">
                        <TextShine text="Unraveling genetic secrets, one sequence at a time..." />
                      </div>
                    )}

                    <Tabs defaultValue="core_data" className="w-full bg-muted/50 dark:bg-muted/20 rounded-lg p-1">
                      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/20 dark:bg-muted/10 p-1" activeClassName="bg-primary shadow-md rounded-md">
                        <TabsTrigger value="core_data" className="text-foreground/70 data-[state=active]:text-white font-bold transition-colors">Core Data & Plots</TabsTrigger>
                        <TabsTrigger value="ssr_gene_intersection" className="text-foreground/70 data-[state=active]:text-white font-bold transition-colors">SSR-Gene Intersection</TabsTrigger>
                        <TabsTrigger value="hotspot_data" className="text-foreground/70 data-[state=active]:text-white font-bold transition-colors">Hotspot Data & Plot</TabsTrigger>
                        <TabsTrigger value="hssr_data" className="text-foreground/70 data-[state=active]:text-white font-bold transition-colors">HSSR Data & Plots</TabsTrigger>
                      </TabsList>

                      <TabsContents className="mx-1 mb-1 -mt-2 rounded-sm h-full bg-background">
                        <TabsContent value="core_data" className="space-y-4">
                          {isPlotSourceLoading ? <TabContentSkeleton /> : isPlotSourceAvailable && availableTableData['plot_source'] ? (
                            <>
                              <Tabs defaultValue="category_country_sankey" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-8 mb-4 bg-muted/20 dark:bg-muted/10 p-1" activeClassName="bg-primary shadow-sm rounded-md">
                                  <TabsTrigger value="category_country_sankey" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">Cat → Country</TabsTrigger>
                                  <TabsTrigger value="ssr_gc_distribution" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">SSR GC Dist.</TabsTrigger>
                                  <TabsTrigger value="motif_conservation" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">Motif Conserv.</TabsTrigger>
                                  <TabsTrigger value="ssr_conservation" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">SSR Conserv.</TabsTrigger>
                                  <TabsTrigger value="upset_plot" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">UpSet Plot</TabsTrigger>
                                  <TabsTrigger value="relative_abundance" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">Rel. Abundance</TabsTrigger>
                                  <TabsTrigger value="relative_density" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">Rel. Density</TabsTrigger>
                                  <TabsTrigger value="motif_distribution_heatmap" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">Motif Heatmap</TabsTrigger>
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
                              <Separator />
                              <DataTable
                                data={availableTableData['plot_source'].data}
                                columns={availableTableData['plot_source'].columns}
                                caption="Core analysis data."
                                tableName="core_data"
                              />
                            </>
                          ) : !isAnyDataLoading && (
                            <Alert><Info className="h-4 w-4" /><AlertTitle>No Core Data</AlertTitle><AlertDescription>Core data is not available for this job.</AlertDescription></Alert>
                          )}
                        </TabsContent>

                        <TabsContent value="ssr_gene_intersection" className="space-y-4">
                          {isSsrGeneIntersectLoading ? <TabContentSkeleton /> : isSsrGeneIntersectAvailable && availableTableData['ssr_gene_intersect'] ? (
                            <>
                              <Tabs defaultValue="ssr_gene_intersect" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/20 dark:bg-muted/10 p-1" activeClassName="bg-primary shadow-sm rounded-md">
                                  <TabsTrigger value="ssr_gene_intersect" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">Intersection Plot</TabsTrigger>
                                  <TabsTrigger value="ref_ssr_dist" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors" disabled={!submittedReferenceId}>Ref. SSR Dist.</TabsTrigger>
                                </TabsList>
                                <TabsContent value="ssr_gene_intersect"><SsrGeneIntersectionPlot queryResult={ssrGeneIntersectResult} /></TabsContent>
                                <TabsContent value="ref_ssr_dist">
                                  {submittedReferenceId ? (
                                    <ReferenceSsrDistributionPlot queryResult={ssrGeneIntersectResult} referenceId={submittedReferenceId} />
                                  ) : (
                                    <Alert variant="default">
                                      <Info className="h-4 w-4" />
                                      <AlertTitle>Reference SSR Distribution</AlertTitle>
                                      <AlertDescription>Reference ID not provided during submission, skipping this plot.</AlertDescription>
                                    </Alert>
                                  )}
                                </TabsContent>
                              </Tabs>
                              <Separator />
                              <DataTable
                                data={availableTableData['ssr_gene_intersect'].data}
                                columns={availableTableData['ssr_gene_intersect'].columns}
                                caption="SSR-Gene intersection data."
                                tableName="ssr_gene_intersect"
                              />
                            </>
                          ) : !isAnyDataLoading && (
                            <Alert><Info className="h-4 w-4" /><AlertTitle>No SSR-Gene Intersection Data</AlertTitle><AlertDescription>SSR-Gene Intersection data is not available for this job.</AlertDescription></Alert>
                          )}
                        </TabsContent>

                        <TabsContent value="hotspot_data" className="space-y-4">
                          {isHotspotLoading ? <TabContentSkeleton /> : isHotspotAvailable && availableTableData['hotspot'] ? (
                            <>
                              <HotspotPlot queryResult={hotspotResult} />
                              <Separator className="my-4" />
                              <DataTable
                                data={availableTableData['hotspot'].data}
                                columns={availableTableData['hotspot'].columns}
                                caption="Hotspot data."
                                tableName="hotspot_data"
                              />
                            </>
                          ) : !isAnyDataLoading && (
                            <Alert><Info className="h-4 w-4" /><AlertTitle>No Hotspot Data</AlertTitle><AlertDescription>Hotspot data is not available for this job.</AlertDescription></Alert>
                          )}
                        </TabsContent>

                        <TabsContent value="hssr_data" className="space-y-4">
                          {isHssrDataLoading ? <TabContentSkeleton /> : isHssrDataAvailable && availableTableData['hssr_data'] ? (
                            <>
                              <Tabs defaultValue="gene_country_sankey" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/20 dark:bg-muted/10 p-1" activeClassName="bg-primary shadow-sm rounded-md">
                                  <TabsTrigger value="gene_country_sankey" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">Gene → Country</TabsTrigger>
                                  <TabsTrigger value="temporal_scatter" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">Temporal Dist.</TabsTrigger>
                                  <TabsTrigger value="ssr_gene_genome_dot" className="text-xs px-2 py-1.5 text-foreground/70 data-[state=active]:text-white font-semibold transition-colors">SSR Dot Plot</TabsTrigger>
                                </TabsList>
                                <TabsContent value="gene_country_sankey">
                                  {isGeneCountrySankeyAvailable && isHssrDataAvailable ? (
                                    <GeneCountrySankeyPlot linkDataQueryResult={geneCountrySankeyResult} hotspotDataQueryResult={hssrDataResult} />
                                  ) : (isGeneCountrySankeyLoading || isHssrDataLoading) ? (
                                    <Skeleton className="h-[400px] w-full" />
                                  ) : (geneCountrySankeyResult?.isError || hssrDataResult?.isError) ? (
                                    <Alert variant="destructive">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertTitle>Gene → Country Plot Error</AlertTitle>
                                      <AlertDescription>{geneCountrySankeyResult?.error ? (geneCountrySankeyResult.error as Error).message : 'Failed to load data.'}</AlertDescription>
                                    </Alert>
                                  ) : (
                                    <p className="text-sm text-muted-foreground p-4 text-center">Gene → Country data not available.</p>
                                  )}
                                </TabsContent>
                                <TabsContent value="temporal_scatter"><TemporalFacetedScatterPlot queryResult={hssrDataResult} /></TabsContent>
                                <TabsContent value="ssr_gene_genome_dot"><SsrGeneGenomeDotPlot queryResult={hssrDataResult} referenceId={submittedReferenceId} /></TabsContent>
                              </Tabs>
                              <Separator />
                              <DataTable
                                data={availableTableData['hssr_data'].data}
                                columns={availableTableData['hssr_data'].columns}
                                caption="HSSR data."
                                tableName="hssr_data"
                              />
                            </>
                          ) : !isAnyDataLoading && (
                            <Alert><Info className="h-4 w-4" /><AlertTitle>No HSSR Data</AlertTitle><AlertDescription>HSSR data is not available for this job.</AlertDescription></Alert>
                          )}
                        </TabsContent>
                      </TabsContents>
                    </Tabs>

                    {/* Message if no results at all (small jobs only) */}
                    {!isAnyDataLoading && !isAnyResultAvailable && jobStatus === 'completed' && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>No Results Generated</AlertTitle>
                        <AlertDescription>
                          No data tables or plots were generated for this job, or the result files were empty. Check the job logs or download the full results zip for details.
                        </AlertDescription>
                      </Alert>
                    )}
                      </>
                    )}

                    {/* Use Loader for any loading state that's not failed or completed */}
                    {jobId && jobStatus && jobStatus !== 'completed' && jobStatus !== 'failed' && (
                      <div className="flex justify-center items-center">
                        <Loader
                          text={jobStatus === 'running'
                            ? 'Processing your analysis...'
                            : jobStatus === 'queued'
                              ? 'Job queued, waiting to start...'
                              : 'Initializing analysis...'}
                        />
                      </div>
                    )}

                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* --- Bottom Navigation Bar --- */}
      <AnalysisBottomNav onLoadExample={handleLoadExample} onLoadDemo={handleLoadDemoJob} />
    </div>
  );
}
