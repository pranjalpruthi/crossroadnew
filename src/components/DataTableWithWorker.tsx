import { useState, useEffect } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  type ColumnDef,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState
} from '@tanstack/react-table';
import { type UseQueryResult } from '@tanstack/react-query';
import { useDataProcessing } from '@/lib/hooks/useDataProcessing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from 'lucide-react';

interface DataTableWithWorkerProps<TData extends Record<string, any>> {
  /**
   * The query result containing the data to display
   */
  queryResult: UseQueryResult<any>;
  /**
   * The columns definition for the table
   */
  columns?: ColumnDef<TData>[];
  /**
   * Optional caption for the table
   */
  caption?: string;
  /**
   * Whether to enable automatic global filtering
   */
  enableFiltering?: boolean;
  /**
   * Optional placeholder for the search input
   */
  searchPlaceholder?: string;
}

/**
 * A wrapper around DataTable that uses Web Workers for data processing
 */
export function DataTableWithWorker<TData extends Record<string, any>>({
  queryResult,
  columns: customColumns,
  caption,
  enableFiltering = true,
  searchPlaceholder = 'Search...'
}: DataTableWithWorkerProps<TData>) {
  const [columns, setColumns] = useState<ColumnDef<TData>[]>([]);
  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Use our custom hook to process data in a web worker
  const {
    data,
    isProcessing,
    error,
    parseArrowData,
    filterData
  } = useDataProcessing<TData>();
  
  const [filteredData, setFilteredData] = useState<TData[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Parse Arrow data when query result changes
  useEffect(() => {
    if (queryResult.isSuccess && queryResult.data?.data) {
      parseArrowData(queryResult)
        .then(parsedData => {
          if (!parsedData) return;
          
          // Create columns if not provided
          if (!customColumns && parsedData.length > 0) {
            setIsLoadingColumns(true);
            const firstRow = parsedData[0] as Record<string, any>;
            const autoColumns: ColumnDef<TData>[] = Object.keys(firstRow).map(key => ({
              accessorKey: key,
              header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              cell: info => {
                const value = info.getValue();
                return value === null || value === undefined ? '' : String(value);
              }
            })) as ColumnDef<TData>[];
            
            setColumns(autoColumns);
            setIsLoadingColumns(false);
          } else if (customColumns) {
            setColumns(customColumns);
            setIsLoadingColumns(false);
          }
          
          setFilteredData(parsedData);
        });
    }
  }, [queryResult.isSuccess, queryResult.data, customColumns, parseArrowData]);
  
  // Apply filtering when filter or data changes
  useEffect(() => {
    if (!data || !globalFilter) {
      setFilteredData(data || []);
      return;
    }
    
    // Use the worker to filter data
    filterData(data, { global: globalFilter })
      .then(result => {
        setFilteredData(result);
      })
      .catch(err => {
        console.error('Error filtering data:', err);
        setFilteredData(data); // Fall back to unfiltered data on error
      });
  }, [data, globalFilter, filterData]);
  
  // Create the table instance
  const table = useReactTable({
    data: filteredData || [],
    columns: columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
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
  
  // Handle loading states and errors
  const isLoading = queryResult.isLoading || isProcessing || isLoadingColumns;
  const displayError = error || queryResult.error;
  
  if (displayError) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error loading table data: {String(displayError)}</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      // Show skeleton loading state
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-full"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded w-full"></div>
        ))}
      </div>
    );
  }
  
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        {data && data.length > 0 
          ? 'No matching records found.'
          : 'No data available.'}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {enableFiltering && (
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm h-8 text-sm"
        />
      )}
      
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
                      {/* Sorting Indicator */}
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between gap-4 py-4 text-sm">
          {/* Rows per page selector */}
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

          {/* Page number information */}
          <div className="flex w-[100px] items-center justify-center text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex" // Hide on small screens
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
              className="hidden h-8 w-8 p-0 lg:flex" // Hide on small screens
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Go to last page"
            >
              <ChevronLastIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 