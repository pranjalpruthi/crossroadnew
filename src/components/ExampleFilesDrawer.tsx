import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { 
  Download, 
  TableProperties, 
  Database, 
  FileType, 
  Dna, 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Card gradient backgrounds based on file type
const CARD_GRADIENTS = {
  FASTA: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-900/30",
  TSV: "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-900/30",
  BED: "bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/30"
};

// Badge colors based on file type
const BADGE_VARIANTS: Record<string, any> = {
  FASTA: { variant: "outline", className: "border-blue-300 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  TSV: { variant: "outline", className: "border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  BED: { variant: "outline", className: "border-teal-300 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" }
};

// Example data for the three sample files
const EXAMPLE_FILES = [
  {
    id: '1.fa',
    name: 'Example Genomes',
    type: 'FASTA',
    description: 'FASTA file containing genomic sequences for example genomes.',
    icon: <Dna className="h-5 w-5" />,
    path: '/sample/1.fa',
    preview: [
      '>EPI_ISL_13058459',
      'ATGACGTACGTAGCTAGCTAGCTAGCTAGCTACGTAGCTAGCTAGCTACG',
      'ACGTACGTAGCTAGCTAGCCGTAGCTAGCTAGCTAGCTACGTAGCTAGCT',
      '>EPI_ISL_13058466',
      'ATGACGTACGTAGCTAGCTAGCTAGCTAGCTACGTAGCTAGCTAGCTACG',
      'ACGTACGTAGCTAGCTAGCCGTAGCTAGCTAGCTAGCTACGTAGCTAGCT'
    ]
  },
  {
    id: '3.tsv',
    name: 'Example Metadata',
    type: 'TSV',
    description: 'TSV file with metadata (category, country, year) for each genome.',
    icon: <Database className="h-5 w-5" />,
    path: '/sample/3.tsv',
    columns: ['genomeID', 'category', 'country', 'year'],
    preview: [
      { genomeID: 'EPI_ISL_13058459', category: 'I', country: 'Sudan', year: '2005' },
      { genomeID: 'EPI_ISL_13058466', category: 'I', country: 'Central_African_Republic', year: '2017' }
    ]
  },
  {
    id: '2.bed',
    name: 'Example Gene Locations',
    type: 'BED',
    description: 'BED file defining gene locations and names.',
    icon: <FileType className="h-5 w-5" />,
    path: '/sample/2.bed',
    columns: ['genomeID', 'start', 'end', 'gene'],
    preview: [
      { genomeID: 'EPI_ISL_13308158', start: '76', end: '816', gene: 'OPG001' },
      { genomeID: 'EPI_ISL_13308158', start: '943', end: '1992', gene: 'OPG002' },
      { genomeID: 'EPI_ISL_13308158', start: '2082', end: '3848', gene: 'OPG003' }
    ]
  }
];
// Generic data table component
function DataTable({ columns, data }: { columns: string[], data: Record<string, string>[] }) {
  const tableColumns: ColumnDef<Record<string, string>>[] = columns.map(col => ({
    accessorKey: col,
    header: () => (
      <div className="font-semibold text-primary">{col}</div>
    ),
    cell: info => info.getValue() as string
  }));

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}


// File Preview Drawer component
function FilePreviewDrawer({ file, isOpen, setIsOpen }: { 
  file: typeof EXAMPLE_FILES[0], 
  isOpen: boolean, 
  setIsOpen: (isOpen: boolean) => void 
}) {
  // Mock data fetch - in real app would fetch the full file
  const { data, isLoading } = useQuery({
    queryKey: ['file-preview', file.id],
    queryFn: async () => {
      // This would normally be a fetch to get the actual file content
      return {
        // Use the preview data as mock data, but generate more rows for demo
        data: file.type === 'FASTA' 
          ? file.preview 
          : Array(15).fill(0).map((_, i) => {
              if (i < (file.preview as Record<string, string>[]).length) {
                return (file.preview as Record<string, string>[])[i];
              }
              // Generate additional mock rows
              if (file.id === '3.tsv') {
                return {
                  genomeID: `EPI_ISL_1305${8470 + i}`,
                  category: ['I', 'II', 'III'][i % 3],
                  country: ['Sudan', 'Central_African_Republic', 'Nigeria', 'Cameroon', 'Congo'][i % 5],
                  year: (2005 + i % 15).toString()
                };
              } else {
                return {
                  genomeID: `EPI_ISL_13308158`,
                  start: (2000 + i * 1000).toString(),
                  end: (3000 + i * 1000).toString(),
                  gene: `OPG00${4 + i}`
                };
              }
            })
      };
    },
    enabled: isOpen,
  });

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2">
            {file.icon}
            <DrawerTitle>{file.name}</DrawerTitle>
          </div>
          <DrawerDescription>{file.description}</DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 pb-4">
          {file.columns && (
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-sm text-muted-foreground mr-2">Columns:</span>
              {file.columns.map(col => (
                <Badge 
                  key={col} 
                  variant="outline" 
                  className={cn("font-mono", BADGE_VARIANTS[file.type].className)}
                >
                  {col}
                </Badge>
              ))}
            </div>
          )}
          
          <Card>
            <CardHeader className="py-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">File Preview</CardTitle>
                <Badge 
                  variant="secondary" 
                  className={BADGE_VARIANTS[file.type].className}
                >
                  {file.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-b-lg">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  file.type === 'FASTA' ? (
                    <div className="p-4 font-mono text-sm max-h-[300px]">
                      {(data?.data as string[]).map((line, index) => (
                        <div key={index} className={line.startsWith('>') ? "font-bold text-primary" : ""}>
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2">
                      <DataTable 
                        columns={file.columns || []} 
                        data={data?.data as Record<string, string>[]} 
                      />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DrawerFooter className="sm:flex-row sm:justify-between">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              // Implement actual download
              toast.success(`Downloading ${file.name}...`);
              
              // Create a hidden anchor element to trigger the download
              const link = document.createElement('a');
              link.href = file.path;
              link.download = file.id;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="h-4 w-4" />
            Download File
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" size="sm">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function ExampleFilesDrawer({ children, onLoadExample, onLoadDemo }: { 
  children: React.ReactNode; 
  onLoadExample: (exampleName: string) => void;
  onLoadDemo?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<typeof EXAMPLE_FILES[0] | null>(null);
  
  const handleLoadExample = (exampleId: string) => {
    onLoadExample(exampleId);
    toast.success(`Loaded example: ${exampleId}`);
    setIsOpen(false);
  };

  const handleLoadDemoAnalysis = () => {
    if (onLoadDemo) {
      onLoadDemo();
      setIsOpen(false);
    }
  };

  const handleDownloadFile = (file: typeof EXAMPLE_FILES[0]) => {
    // Implement actual download
    toast.success(`Downloading ${file.name}...`);
    
    // Create a hidden anchor element to trigger the download
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.id;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewFile = (file: typeof EXAMPLE_FILES[0]) => {
    if (file.type === 'FASTA') {
      // For FASTA files, just load the example
      handleLoadExample(file.id);
    } else {
      // For TSV/BED files, open the preview drawer
      setPreviewFile(file);
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="fixed inset-x-0 bottom-0 mt-24 flex h-[85vh] flex-col rounded-t-[10px] border bg-background/80 backdrop-blur-xl">
          <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
          
          <div className="flex-1 overflow-y-auto px-4">
            <DrawerHeader>
              <DrawerTitle>Example Datasets</DrawerTitle>
              <DrawerDescription>
                Example sample files and job ID for testing
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="space-y-6 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXAMPLE_FILES.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={cn("overflow-hidden border-t-4 h-full flex flex-col", 
                      CARD_GRADIENTS[file.type as keyof typeof CARD_GRADIENTS],
                      file.type === 'FASTA' ? "border-t-blue-400" : 
                      file.type === 'TSV' ? "border-t-amber-400" : "border-t-teal-400"
                    )}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                          {file.icon}
                          <CardTitle className="text-lg">{file.name}</CardTitle>
                        </div>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={cn("cursor-help", BADGE_VARIANTS[file.type].className)}
                            >
                              {file.type}
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="flex flex-col gap-2">
                              <h4 className="font-medium">{file.type} Format</h4>
                              <p className="text-sm text-muted-foreground">
                                {file.type === 'FASTA' && "FASTA format is used for representing nucleotide sequences. Each sequence begins with a '>' followed by a description, then the sequence data."}
                                {file.type === 'TSV' && "Tab-Separated Values (TSV) format contains genome metadata with fields separated by tabs. Each row represents a genome with its associated information."}
                                {file.type === 'BED' && "Browser Extensible Data (BED) format is used for describing genomic features. It contains chromosome/genome coordinates and associated feature information."}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </CardHeader>
                      <CardDescription className="px-6">{file.description}</CardDescription>
                      
                      <CardContent className="p-4 flex-1">
                        {file.columns && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {file.columns.map(col => (
                              <HoverCard key={col}>
                                <HoverCardTrigger asChild>
                                  <Badge 
                                    variant="secondary" 
                                    className={cn("cursor-help", BADGE_VARIANTS[file.type].className)}
                                  >
                                    {col}
                                  </Badge>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-64">
                                  <div className="flex flex-col gap-2">
                                    <h4 className="font-medium">{col}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {col === 'genomeID' && "Unique identifier for each genome sequence"}
                                      {col === 'category' && "Classification category of the genome"}
                                      {col === 'country' && "Country of origin for the sample"}
                                      {col === 'year' && "Year the sample was collected"}
                                      {col === 'start' && "Start position of the gene in the genome"}
                                      {col === 'end' && "End position of the gene in the genome"}
                                      {col === 'gene' && "Gene identifier or name"}
                                    </p>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            ))}
                          </div>
                        )}
                        
                        <div className="h-[160px] overflow-hidden rounded border bg-white/80 dark:bg-black/20 p-2">
                          {file.type === 'FASTA' ? (
                            <div className="font-mono text-sm">
                              {(file.preview as string[]).map((line, index) => (
                                <div key={index} className={line.startsWith('>') ? "font-bold text-primary" : ""}>
                                  {line}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <DataTable 
                              columns={file.columns || []} 
                              data={file.preview as Record<string, string>[]} 
                            />
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex justify-between bg-white/50 dark:bg-black/10 mt-auto p-3">
                        {file.type !== 'FASTA' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="flex items-center gap-1 sm:gap-2"
                            onClick={() => handlePreviewFile(file)}
                          >
                            <TableProperties className="h-4 w-4" />
                            <span className="sm:inline">Preview</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={cn("flex items-center gap-1 sm:gap-2", 
                            file.type === 'FASTA' ? "ml-auto" : "")}
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sm:inline">Download</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          <DrawerFooter className="border-t bg-background/80 backdrop-blur-xl mt-auto sm:flex-row sm:justify-between">
            {onLoadDemo && (
              <Button 
                className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600"
                onClick={handleLoadDemoAnalysis}
              >
                <Database className="mr-2 h-4 w-4" />
                Load Example Analysis Demo
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {previewFile && (
        <FilePreviewDrawer 
          file={previewFile} 
          isOpen={!!previewFile} 
          setIsOpen={(open) => {
            if (!open) setPreviewFile(null);
          }} 
        />
      )}
    </>
  );
}

// Adding a specific button component to open the drawer
export function OpenExampleFilesButton({ onLoadExample }: { onLoadExample: (exampleName: string) => void }) {
  return (
    <ExampleFilesDrawer onLoadExample={onLoadExample}>
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
      >
        <Database className="h-4 w-4" />
        Open Example Files
      </Button>
    </ExampleFilesDrawer>
  );
}
