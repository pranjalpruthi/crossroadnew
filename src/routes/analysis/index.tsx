import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { createFileRoute, Link } from '@tanstack/react-router';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Icons and Animation ---
import {
   Loader2, AlertCircle, Download, TableIcon, DatabaseZap, Info, Search,
   AreaChart, GitBranch,
  ChevronUpIcon, ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Filter,
  ChevronDown,
  File, // Added File icon
  BookOpen, // Added BookOpen icon
  History, // Added History icon
  Settings2, // Added Settings2 icon
  Sparkles, // Added Sparkles icon
} from "lucide-react";
import { motion } from 'framer-motion';
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

// --- Constants ---
const API_BASE_URL = 'http://127.0.0.1:8000';
const POLLING_INTERVAL = 3000;

// Define keys to fetch - plot_source is used by multiple plots
// Added 'gene_country_sankey' to fetch its specific data
const PLOT_KEYS_TO_FETCH = ['plot_source', 'hssr_data', 'hotspot', 'ssr_gene_intersect', 'gene_country_sankey'] as const;
type PlotKey = typeof PLOT_KEYS_TO_FETCH[number];

// Type for the result of a single query within useQueries
type PlotQueryResult = UseQueryResult<{ plotKey: PlotKey; data: any[] | null; error?: string }, Error>;

// TextShine component for loading state
export function TextShine() {
  return (
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
      Fetching data...
    </motion.h1>
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
  di: z.number().int().min(1).default(4),
  tri: z.number().int().min(1).default(3),
  tetra: z.number().int().min(1).default(3),
  penta: z.number().int().min(1).default(3),
  hexa: z.number().int().min(1).default(2),
  minLen: z.number().int().min(0).default(156000),
  maxLen: z.number().int().min(0).default(10000000),
  unfair: z.number().int().min(0).default(0),
  thread: z.number().int().min(1).default(50),
  min_repeat_count: z.number().int().min(1).default(1),
  min_genome_count: z.number().int().min(1).default(5),
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

// Explicit type for default values structure
type FormDefaultValues = {
  fasta_file: undefined; // FileList defaults are typically undefined
  categories_file: undefined;
  gene_bed: undefined;
  reference_id?: string;
  flanks: boolean;
  perf_params: PerfParams; // Use the existing PerfParams type
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
      ...table.getRowModel().rows.map(row => 
        headers.map(header => {
          const value = row.getValue(header);
          return typeof value === 'string' ? `"${value}"` : value;
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
  const queryClient = useQueryClient(); // Get query client instance

  // Explicitly define default performance parameters
  const defaultPerfParams: PerfParams = {
    mono: 12,
    di: 4,
    tri: 3,
    tetra: 3,
    penta: 3,
    hexa: 2,
    minLen: 156000,
    maxLen: 10000000,
    unfair: 0,
    thread: 50,
    min_repeat_count: 1,
    min_genome_count: 5,
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

  const form = useForm<
    FormValues,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    unknown
  >({
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
    formData.append('perf_params', JSON.stringify(value.perf_params));
    return formData;
  };

  // --- TanStack Query: Job Submission Mutation ---
  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`${API_BASE_URL}/analyze_ssr/`, { method: 'POST', body: formData });
      if (!response.ok) {
        let errorDetail = `HTTP error ${response.status}`;
        try { const errorJson = await response.json(); errorDetail = errorJson.detail || JSON.stringify(errorJson); } catch (e) {}
        throw new Error(`Server error: ${response.status} - ${errorDetail}`);
      }
      if (response.status !== 202) throw new Error(`Expected status 202, got ${response.status}`);
      return response.json();
    },
    onMutate: () => {
       toast.loading("Submitting analysis job...", { id: 'job-submission' });
       setJobId(null); setJobUrls(null); setJobStatus(null); setJobMessage(null);
       setJobProgress(null); setJobError(null); setSubmittedReferenceId(null); // Clear submitted ref ID on new submission
     },
     onSuccess: (data) => { // Remove unused variables parameter
       // Explicitly use only the 'data' parameter from onSuccess for job details
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

       // Update state based ONLY on the 'data' parameter
       setJobId(newJobId);
       setJobStatus(initialStatus);
       setJobMessage(initialMessage);
       setJobUrls(newUrls);
       // Store the reference_id from the *submitted* form values
       // We need to get it from the submitted form data, which isn't directly passed here.
       // A workaround is to read it from the form state *before* reset, assuming it hasn't changed.
       // Or better, pass the submitted values to onSuccess if the library supports it.
       // Let's assume we can access the submitted value via the form instance before reset.
       const submittedValues = form.state.values; // Get values before reset
       setSubmittedReferenceId(submittedValues.reference_id || null); // Store submitted ref ID

       // Show toast based ONLY on the 'data' parameter
      toast.success(`Job ${newJobId} submitted! Initial Status: ${initialStatus}.`, { id: 'job-submission' });

      // Reset form
      form.reset();
     },
     onError: (error: any) => {
       toast.error(`Submission failed: ${error.message || 'Unknown error'}`, { id: 'job-submission' });
       setJobError(error.message || 'Submission failed');
       setSubmittedReferenceId(null); // Clear submitted ref ID on error
     },
   });

  // --- TanStack Query: Job Status Polling ---
  const { data: statusData, isError: isStatusError, error: statusFetchError } = useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      if (!jobUrls?.statusUrl) return null;
      const url = new URL(jobUrls.statusUrl, API_BASE_URL).toString();
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

  // --- Fetch Multiple Table Data via Arrow using useQueries ---
  const plotDataQueries = useQueries({
    queries: PLOT_KEYS_TO_FETCH.map((plotKey) => ({
      queryKey: ['plotData', jobId, plotKey],
      queryFn: async (): Promise<{ plotKey: PlotKey; data: any[] | null; error?: string }> => {
        if (!jobStatus || jobStatus !== 'completed' || !jobUrls?.resultsBase) {
          return { plotKey, data: null }; // Return null if prerequisites not met
        }
        const url = `${API_BASE_URL}${jobUrls.resultsBase}${plotKey}`;
        try {
          const resp = await fetch(url);
          if (resp.status === 204) { // Handle No Content
             return { plotKey, data: [] }; // Empty array signifies no data
          }
          if (!resp.ok) {
            throw new Error(`Status ${resp.status}`);
          }
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
          return { plotKey, data };
        } catch (error: any) {
          console.error(`Failed to fetch or parse data for ${plotKey}:`, error);
          return { plotKey, data: null, error: error.message || 'Fetch/Parse Error' };
        }
      },
      enabled: jobStatus === 'completed' && !!jobUrls?.resultsBase,
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
     <div className="px-4 md:px-6 py-12 md:py-16 lg:py-20">
        <Toaster richColors position="top-center" />

        {/* --- Header --- */}
       <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
         <h1 className="font-bold tracking-tighter text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
           Crossroad <span className="block bg-gradient-to-r from-primary via-primary/75 to-primary/50 bg-clip-text text-transparent font-semibold">SSR Analysis Pipeline</span>
         </h1>
         <p className="mx-auto max-w-[700px] text-muted-foreground text-sm md:text-base lg:text-lg mt-4">
           Analyze Simple Sequence Repeats (SSRs), compare across genomes, identify hotspots, and trace evolutionary patterns.
         </p>
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
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border border-gray-200/60 dark:border-gray-800/60 shadow-sm rounded-xl">
              <CardHeader>
                 <CardTitle className="text-lg font-medium flex items-center"><File className="mr-2 h-5 w-5" /> Upload Your Data</CardTitle>
                 <CardDescription>Provide the required FASTA file and optional metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {/* FASTA File */}
                 <form.Field name="fasta_file">{(field) => (
                   <div className="space-y-1.5">
                     <Label htmlFor={field.name} className="text-xs font-medium text-gray-700 dark:text-gray-300">FASTA File <span className="text-red-500">*</span></Label>
                     {/* Removed extra div wrapper */}
                     <FileUpload
                        onChange={(files) => {
                          if (files.length > 0) {
                            const dataTransfer = new DataTransfer();
                            files.forEach(file => dataTransfer.items.add(file));
                            field.handleChange(dataTransfer.files);
                          }
                        }}
                        accept=".fa,.fasta"
                        required={true}
                        title="FASTA File (.fa, .fasta)"
                        description="Required genomic sequences"
                        fileTypeHint="fasta"
                      />
                     <FieldInfo field={field} />
                   </div>
                 )}</form.Field>

                 {/* Optional Files in a Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   {/* Categories File */}
                   <form.Field name="categories_file">{(field) => (
                     <div className="space-y-1.5">
                       <Label htmlFor={field.name} className="text-xs font-medium text-gray-700 dark:text-gray-300">Categories File <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                       <FileUpload
                         onChange={(files) => {
                           if (files.length > 0) {
                             const dataTransfer = new DataTransfer();
                             files.forEach(file => dataTransfer.items.add(file));
                             field.handleChange(dataTransfer.files);
                           }
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
                     <div className="space-y-1.5">
                       <Label htmlFor={field.name} className="text-xs font-medium text-gray-700 dark:text-gray-300">Gene BED File <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                       <FileUpload
                         onChange={(files) => {
                           if (files.length > 0) {
                             const dataTransfer = new DataTransfer();
                             files.forEach(file => dataTransfer.items.add(file));
                             field.handleChange(dataTransfer.files);
                           }
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
           <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border border-gray-200/60 dark:border-gray-800/60 shadow-sm rounded-xl">
             <CardHeader>
               <CardTitle className="text-lg font-medium flex items-center"><Settings2 className="mr-2 h-5 w-5" /> Analysis Configuration</CardTitle>
               <CardDescription>Fine-tune analysis parameters.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Reference ID */}
               <form.Field name="reference_id">{(field) => (
                 <div className="space-y-1.5">
                   <Label htmlFor={field.name} className="text-xs font-medium text-gray-700 dark:text-gray-300">Reference ID <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                   <Input
                     id={field.name}
                     name={field.name}
                     value={field.state.value ?? ''}
                     onBlur={field.handleBlur}
                     onChange={(e) => field.handleChange(e.target.value)}
                     placeholder="e.g., NC_063383.1 (for reference-specific plots)"
                     className="border-gray-200/80 dark:border-gray-800/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-all hover:border-primary/40 rounded-md h-9 text-sm"
                   />
                   <FieldInfo field={field} />
                 </div>
               )}</form.Field>

               {/* Flanks Toggle */}
               <form.Field name="flanks">{(field) => (
                 <div className="flex items-center justify-between p-3 border border-gray-200/80 dark:border-gray-800/70 rounded-lg bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all hover:border-primary/40">
                   <div className="space-y-0.5">
                     <Label htmlFor={field.name} className="text-sm font-medium text-gray-800 dark:text-gray-200">Include Flanking Regions</Label>
                     <p className="text-xs text-muted-foreground">Analyze regions surrounding SSRs</p>
                   </div>
                   <Switch
                     id={field.name}
                     aria-label="Toggle flanking regions"
                     checked={field.state.value}
                     onCheckedChange={(checked: boolean) => field.handleChange(checked)}
                   />
                 </div>
               )}</form.Field>

               {/* PERF Parameters Accordion */}
               <Accordion type="single" collapsible className="w-full">
                 <AccordionItem value="perf-params" className="border border-gray-200/80 dark:border-gray-800/70 rounded-lg overflow-hidden bg-gray-50/30 dark:bg-gray-900/30">
                   <AccordionTrigger className="px-4 py-2.5 text-sm font-medium hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                      Advanced PERF Parameters (Optional)
                   </AccordionTrigger>
                   <AccordionContent className="px-4 pt-3 pb-4 border-t border-gray-200/80 dark:border-gray-800/70 bg-white/50 dark:bg-gray-950/50">
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                       {Object.keys(defaultPerfParams).map((key) => (
                         <form.Field key={key} name={`perf_params.${key}` as keyof FormValues}>
                           {(field) => (
                             <div className="space-y-1">
                               <Label htmlFor={field.name} className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">{key.replace(/_/g, ' ')}</Label>
                               <Input
                                 id={field.name}
                                 name={field.name}
                                 type="number"
                                 value={String(field.state.value ?? '')}
                                 onBlur={field.handleBlur}
                                 onChange={(e) => field.handleChange(e.target.value)}
                                 className="h-8 text-sm border-gray-200/80 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all hover:border-primary/40 rounded-md"
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

           {/* Submit Button */}
           <div className="flex justify-end pt-2">
             <form.Subscribe selector={(state) => [state.canSubmit, state.isValid, state.isValidating]}>
               {([canSubmit, isValid, isValidating]) => (
                 <Button
                   type="submit"
                   disabled={!isValid || !canSubmit || submitMutation.isPending || isValidating || (!!jobId && jobStatus !== 'failed')}
                   className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md rounded-md px-6 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105"
                   size="lg"
                 >
                   {submitMutation.isPending || isValidating ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       {isValidating ? 'Validating...' : 'Submitting Job...'}
                     </>
                   ) : (
                     <>
                       Run Analysis <Sparkles className="ml-2 h-4 w-4" />
                     </>
                   )}
                 </Button>
               )}
             </form.Subscribe>
           </div>
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
                 <p>5. Click "Run Analysis"!</p>
               </CardContent>
               <CardFooter>
                 {/* Placeholder for tutorial link */}
                  <Button variant="outline" size="sm" className="w-full border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/50" onClick={() => toast.info("Tutorial coming soon!")}>
                    <BookOpen className="mr-2 h-4 w-4" /> View Full Tutorial
                  </Button>
               </CardFooter>
            </Card>

           {/* Load Previous Job */}
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border border-gray-200/60 dark:border-gray-800/60 shadow-sm rounded-xl">
               <CardHeader>
                 <CardTitle className="text-lg font-medium flex items-center"><History className="mr-2 h-5 w-5" /> Load Previous Job</CardTitle>
                 <CardDescription>Enter a Job ID to retrieve past results.</CardDescription>
               </CardHeader>
               <CardContent className="flex flex-col sm:flex-row items-stretch gap-3">
                 <Label htmlFor="previous-job-id" className="sr-only">Previous Job ID</Label>
                 <Input
                   id="previous-job-id"
                   placeholder="Enter Job ID..."
                   value={previousJobIdInput}
                   onChange={(e) => setPreviousJobIdInput(e.target.value)}
                   className="flex-grow border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-all hover:border-primary/40 rounded-md h-9 text-sm shadow-inner"
                   onKeyDown={(e) => { if (e.key === 'Enter') handleLoadPreviousJob(); }}
                 />
                 <Button onClick={handleLoadPreviousJob} disabled={!previousJobIdInput.trim() || submitMutation.isPending || (jobId === previousJobIdInput.trim() && jobStatus !== 'failed')} variant="secondary" className="rounded-md px-4 py-2 text-sm font-medium shadow-sm">
                   <Search className="mr-1.5 h-4 w-4" /> Load Job
                 </Button>
               </CardContent>
            </Card>
         </div>
       </motion.div>

       {/* --- Job Status & Results Section --- */}
       {jobId && (
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-16"> {/* Added more top margin */}
           <Card className="border border-gray-200/60 dark:border-gray-800/60 shadow-lg rounded-xl overflow-hidden"> {/* Enhanced card styling */}
             <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200/60 dark:border-gray-800/60">
               <CardTitle className="text-xl">Job Status: <span className="font-mono text-lg break-all bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{jobId}</span></CardTitle>
               <div className="flex items-center space-x-2 pt-1">
                 <Label>Status:</Label>
                 <Badge variant={jobStatus === 'completed' ? 'default' : jobStatus === 'failed' ? 'destructive' : 'secondary'}>{jobStatus || 'Initializing...'}</Badge>
               </div>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Progress Bar and Message */}
               <div>
                 <p className="text-sm text-muted-foreground mb-2">{jobMessage || (jobId ? 'Fetching status...' : 'Waiting for status...')}</p>
                 {(jobStatus === 'running' || jobStatus === 'queued') && jobProgress !== null && (<Progress value={jobProgress * 100} className="w-full h-2" />)}
               </div>
               {/* Error Display */}
               {jobStatus === 'failed' && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Job Failed</AlertTitle><AlertDescription>{jobError || 'Unknown error'}</AlertDescription></Alert>)}
               {/* Results Controls */}
               {jobStatus === 'completed' && jobUrls && (
                 <div className="space-y-4 pt-4">
                    <Separator />
                    <p className="font-semibold text-lg">Results</p>
                    <Button variant="default" size="sm" onClick={() => jobUrls?.downloadAll && window.open(new URL(jobUrls.downloadAll, API_BASE_URL).toString(), '_blank')} disabled={!jobUrls?.downloadAll}>
                        <Download className="mr-2 h-4 w-4" /> Download Full Results (.zip)
                      </Button>
                    {/* --- Results Structure with Tabs --- */}
                    <div className="mt-6 space-y-8"> {/* Increased spacing */}

                      {/* --- Section: Core Data (plot_source) --- */}
                      {isPlotSourceAvailable && availableTableData['plot_source'] && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <TableIcon className="mr-2 h-5 w-5" /> Core Data & Related Plots
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-8"> {/* Increased spacing between items */}
                            {/* Plot Source Table */}
                            <DataTable
                              data={availableTableData['plot_source'].data}
                              columns={availableTableData['plot_source'].columns}
                              caption="Core analysis data."
                              tableName="core_data"
                            />
                            <Separator />
                            {/* Tabs for Plots derived from Plot Source */}
                            <Tabs defaultValue="relative_abundance" className="w-full">
                              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-8 mb-4">  {/* Updated to 8 columns */}
                                <TabsTrigger value="relative_abundance" className="text-xs px-2 py-1.5">Rel. Abundance</TabsTrigger>
                                <TabsTrigger value="relative_density" className="text-xs px-2 py-1.5">Rel. Density</TabsTrigger>
                                <TabsTrigger value="category_country_sankey" className="text-xs px-2 py-1.5">Cat → Country</TabsTrigger>
                                <TabsTrigger value="motif_conservation" className="text-xs px-2 py-1.5">Motif Conserv.</TabsTrigger>
                                <TabsTrigger value="motif_distribution_heatmap" className="text-xs px-2 py-1.5">Motif Heatmap</TabsTrigger>
                                <TabsTrigger value="ssr_conservation" className="text-xs px-2 py-1.5">SSR Conserv.</TabsTrigger>
                                <TabsTrigger value="ssr_gc_distribution" className="text-xs px-2 py-1.5">SSR GC Dist.</TabsTrigger>
                                <TabsTrigger value="upset_plot" className="text-xs px-2 py-1.5">UpSet Plot</TabsTrigger>
                              </TabsList>
                              <TabsContent value="relative_abundance">
                                <RelativeAbundancePlot queryResult={plotSourceResult} />
                              </TabsContent>
                              <TabsContent value="relative_density">
                                <RelativeDensityPlot queryResult={plotSourceResult} />
                              </TabsContent>
                              <TabsContent value="category_country_sankey">
                                <CategoryCountrySankeyPlot queryResult={plotSourceResult} />
                              </TabsContent>
                              <TabsContent value="motif_conservation">
                                <MotifConservationPlot queryResult={plotSourceResult} />
                              </TabsContent>
                              <TabsContent value="motif_distribution_heatmap">
                                <MotifDistributionHeatmap queryResult={plotSourceResult} />
                              </TabsContent>
                              <TabsContent value="ssr_conservation">
                                <SsrConservationPlot queryResult={plotSourceResult} />
                              </TabsContent>
                              <TabsContent value="ssr_gc_distribution">
                                <SsrGcDistributionPlot queryResult={plotSourceResult} />
                              </TabsContent>
                              <TabsContent value="upset_plot">
                                <UpsetPlot queryResult={plotSourceResult} />
                              </TabsContent>
                            </Tabs>
                          </CardContent>
                        </Card>
                      )}

                      {/* --- Section: HSSR Data & Related Plots --- */}
                      {isHssrDataAvailable && availableTableData['hssr_data'] && (
                         <Card>
                           <CardHeader>
                             <CardTitle className="text-lg flex items-center">
                               <DatabaseZap className="mr-2 h-5 w-5" /> HSSR Data & Related Plots
                             </CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-8"> {/* Increased spacing between items from 6 to 8 */}
                             {/* HSSR Table */}
                             <DataTable
                               data={availableTableData['hssr_data'].data}
                               columns={availableTableData['hssr_data'].columns}
                               caption="HSSR data."
                               tableName="hssr_data"
                              />
                              <Separator />
                              {/* Tabs for Plots derived from HSSR/GeneCountry */}
                              <Tabs defaultValue="gene_country_sankey" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4"> {/* Increased bottom margin from 2 to 4 */}
                                  <TabsTrigger value="gene_country_sankey" className="text-xs px-2 py-1.5">Gene → Country</TabsTrigger>
                                  <TabsTrigger value="temporal_scatter" className="text-xs px-2 py-1.5">Temporal Dist.</TabsTrigger>
                                  <TabsTrigger value="ssr_gene_genome_dot" className="text-xs px-2 py-1.5">SSR Dot Plot</TabsTrigger>
                                </TabsList>
                                <TabsContent value="gene_country_sankey">
                                  {isGeneCountrySankeyAvailable ? (
                                    <GeneCountrySankeyPlot queryResult={geneCountrySankeyResult} />
                                  ) : isGeneCountrySankeyLoading ? (
                                    <Skeleton className="h-[400px] w-full" />
                                  ) : geneCountrySankeyResult?.isError ? (
                                    <Alert variant="destructive">
                                       <AlertCircle className="h-4 w-4" />
                                       <AlertTitle>Gene → Country Plot Error</AlertTitle>
                                       <AlertDescription>{geneCountrySankeyResult.error.message || 'Failed to load data.'}</AlertDescription>
                                    </Alert>
                                  ) : (
                                    <p className="text-sm text-muted-foreground p-4 text-center">Gene → Country data not available.</p>
                                  )}
                                </TabsContent>
                                <TabsContent value="temporal_scatter">
                                  {/* Uses hssr_data */} 
                                  <TemporalFacetedScatterPlot queryResult={hssrDataResult} />
                                </TabsContent>
                                <TabsContent value="ssr_gene_genome_dot">
                                  {/* Uses hssr_data */} 
                                  <SsrGeneGenomeDotPlot
                                    queryResult={hssrDataResult}
                                    referenceId={submittedReferenceId}
                                  />
                                </TabsContent>
                              </Tabs>
                            </CardContent>
                          </Card>
                       )}

                      {/* --- Section: Hotspot Data & Plot --- */}
                      {isHotspotAvailable && availableTableData['hotspot'] && (
                         <Card>
                           <CardHeader>
                             <CardTitle className="text-lg flex items-center">
                               <AreaChart className="mr-2 h-5 w-5" /> Hotspot Data & Plot
                             </CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-8"> {/* Increased spacing between items from 6 to 8 */}
                             {/* Hotspot Table */}
                             <DataTable
                               data={availableTableData['hotspot'].data}
                               columns={availableTableData['hotspot'].columns}
                               caption="Hotspot data."
                               tableName="hotspot_data"
                              />
                              <Separator className="my-4" />
                              {/* Directly render the plot without extra container */}
                              <div className="p-4 border rounded-md min-h-[600px]"> {/* Added container with padding, border, and min-height */}
                                <HotspotPlot queryResult={hotspotResult} />
                              </div>
                            </CardContent>
                          </Card>
                       )}

                      {/* --- Section: SSR Gene Intersection Data & Plots --- */}
                      {isSsrGeneIntersectAvailable && availableTableData['ssr_gene_intersect'] && (
                         <Card>
                           <CardHeader>
                             <CardTitle className="text-lg flex items-center">
                               <GitBranch className="mr-2 h-5 w-5" /> SSR-Gene Intersection & Reference Distribution
                             </CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-8"> {/* Increased spacing between items from 6 to 8 */}
                             {/* SSR Gene Intersection Table */}
                             <DataTable
                               data={availableTableData['ssr_gene_intersect'].data}
                               columns={availableTableData['ssr_gene_intersect'].columns}
                                caption="SSR-Gene intersection data."
                               tableName="ssr_gene_intersect"
                               />
                               <Separator />
                               {/* Tabs for SSR Gene Intersection Plots */}
                               <Tabs defaultValue="ssr_gene_intersect" className="w-full">
                                 <TabsList className="grid w-full grid-cols-2 mb-4"> {/* Increased bottom margin from 2 to 4 */}
                                   <TabsTrigger value="ssr_gene_intersect" className="text-xs px-2 py-1.5">Intersection Plot</TabsTrigger>
                                   <TabsTrigger value="ref_ssr_dist" className="text-xs px-2 py-1.5" disabled={!submittedReferenceId}>Ref. SSR Dist.</TabsTrigger>
                                 </TabsList>
                                 <TabsContent value="ssr_gene_intersect">
                                   <SsrGeneIntersectionPlot queryResult={ssrGeneIntersectResult} />
                                 </TabsContent>
                                 <TabsContent value="ref_ssr_dist">
                                   {submittedReferenceId ? (
                                     <ReferenceSsrDistributionPlot
                                       queryResult={ssrGeneIntersectResult} // Uses the same data source
                                       referenceId={submittedReferenceId}
                                     />
                                   ) : (
                                     <Alert variant="default">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Reference SSR Distribution</AlertTitle>
                                        <AlertDescription>Reference ID not provided during submission, skipping this plot.</AlertDescription>
                                     </Alert>
                                   )}
                                 </TabsContent>
                               </Tabs>
                             </CardContent>
                           </Card>
                        )}

                      {/* Loading Skeletons for sections if data is loading */}
                      {isAnyDataLoading && !isAnyResultAvailable && (
                         <div className="space-y-8">
                            {/* Add TextShine component */}
                            <div className="flex justify-center items-center p-4">
                              <TextShine />
                            </div>
                            {/* Show skeletons matching the card structure */}
                            <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /><Separator /><Skeleton className="h-60 w-full" /></CardContent></Card>
                            <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /><Separator /><Skeleton className="h-60 w-full" /></CardContent></Card>
                         </div>
                      )}

                      {/* Use TextShine for any loading state that's not failed or completed */}
                      {jobId && jobStatus && jobStatus !== 'completed' && jobStatus !== 'failed' && (
                        <div className="flex justify-center items-center p-8">
                          <TextShine />
                        </div>
                      )}

                      {/* Message if no results at all */}
                      {!isAnyDataLoading && !isAnyResultAvailable && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>No Results Generated</AlertTitle>
                          <AlertDescription>
                            No data tables or plots were generated for this job, or the result files were empty. Check the job logs or download the full results zip for details.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
             </CardContent>
           </Card>
         </motion.div>
       )}

       {/* --- Footer --- */}
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-20 text-center text-sm text-muted-foreground"> {/* Increased margin */}
         <p>Crossroad: Developed at CSIR-Institute of Genomics and Integrative Biology.</p>
         <p>Contributors: Pranjal Pruthi, Preeti Agarwal, Dr. Jitendra Narayan</p>
         <div className="mt-2">
            <Link to="/about" className="text-primary hover:underline mr-4">About</Link>
            {/* <a href="YOUR_GITHUB_REPO_LINK" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a> */}
          </div>
       </motion.div>
    </div>
  );
}
