import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, CheckCircle, File as FileIcon, ArrowRight, List, AlertTriangle, RefreshCw } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useVirtualizer } from "@tanstack/react-virtual";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Counter } from "@/components/animate-ui/components/counter";
import { Badge } from "@/components/ui/badge";

type UploadStep = "initial" | "upload" | "validating" | "results";

export const FastaFileUpload = ({
  onChange,
  onGenomeCountChange,
  accept,
  required,
  title = "Upload file",
  description = "Drag or drop your files here or click to upload",
  fileTypeHint,
}: {
  onChange?: (files: File[] | null) => void;
  onGenomeCountChange?: (count: number) => void;
  accept?: string;
  required?: boolean;
  title?: string;
  description?: string;
  fileTypeHint?: 'fasta';
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<UploadStep>("initial");
  const [expectedGenomeCount, setExpectedGenomeCount] = useState<number>(0);
  const [fastaHeaders, setFastaHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setStep("validating");
    const file = newFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const headers = content.match(/>.*/g) || [];
      const extractedHeaders = headers.map(h => h.substring(1));
      
      setFastaHeaders(extractedHeaders);
      setFiles(newFiles);
      onChange?.(newFiles);
      setStep("results");
    };

    reader.readAsText(file);
  };

  const handleReset = () => {
    setFiles([]);
    setFastaHeaders([]);
    setStep("initial");
    setExpectedGenomeCount(0);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: handleFileChange,
    accept: accept ? { [accept]: [] } : undefined,
  });

  const typeSpecificClasses = {
    fasta: "from-green-500/10 to-green-600/10 border-green-200/80 dark:border-green-800/70",
  };
  const defaultClasses = "from-gray-500/10 to-gray-600/10 border-gray-200/80 dark:border-gray-800/70";

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: fastaHeaders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  const countMismatch = expectedGenomeCount > 0 && fastaHeaders.length > 0 && expectedGenomeCount !== fastaHeaders.length;

  return (
    <div
      {...getRootProps()}
      className={cn(
        "p-4 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden bg-gradient-to-br backdrop-blur-sm border transition-all",
        fileTypeHint ? typeSpecificClasses[fileTypeHint] : defaultClasses,
        isDragActive && "border-primary/60"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        required={required}
        onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
        className="hidden"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center text-center"
        >
          {step === "initial" && (
            <div>
              <h3 className="text-lg font-semibold">How many genomes do you have?</h3>
              <p className="text-sm text-muted-foreground mb-4">Enter the expected number of genomes in your FASTA file.</p>
              <div className="flex justify-center">
                <Counter
                  number={expectedGenomeCount}
                  setNumber={(num) => {
                    setExpectedGenomeCount(num);
                    onGenomeCountChange?.(num);
                  }}
                  buttonProps={{ className: 'h-7 w-7 text-lg' }}
                  slidingNumberProps={{ className: 'text-base font-medium' }}
                />
              </div>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStep("upload");
                }}
                className="mt-4"
                size="sm"
                disabled={expectedGenomeCount === 0}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "upload" && (
            <div onClick={(e) => e.stopPropagation()}>
              <Upload className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
              {isDragActive ? (
                <p className="text-primary font-semibold mt-2">Drop the file here ...</p>
              ) : (
                <Button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4" variant="outline">
                  Click to select
                </Button>
              )}
            </div>
          )}

          {step === "validating" && (
            <div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-10 w-10 mx-auto mb-2"
              >
                <FileIcon className="h-full w-full text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold">Reading file locally...</h3>
              <p className="text-sm text-muted-foreground">Checking FASTA headers. Nothing is sent to the server yet.</p>
            </div>
          )}

          {step === "results" && files.length > 0 && (
            <div className="w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-left">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <h3 className="text-lg font-semibold truncate max-w-xs">{files[0].name}</h3>
                    <p className="text-sm text-muted-foreground">{(files[0].size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <List className="mr-2 h-4 w-4" />
                      View Headers
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-2">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">FASTA Headers</h4>
                        <Badge variant="secondary">{fastaHeaders.length} found</Badge>
                      </div>
                      <ScrollArea className="h-[200px]">
                        <div ref={parentRef} className="h-full w-full overflow-y-auto">
                          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                              <div
                              key={virtualItem.key}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                              }}
                              className="flex items-center text-xs p-1.5 hover:bg-muted rounded"
                            >
                              <span className="font-mono truncate">{fastaHeaders[virtualItem.index]}</span>
                            </div>
                            ))}
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="text-center text-xs text-muted-foreground p-2 border-t">
                        List is virtualized for performance.
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {!countMismatch && (
                <div className="w-full mt-2 flex items-center justify-center text-green-500 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <p className="font-semibold">Selected — ready to submit</p>
                </div>
              )}

              {countMismatch && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                    <div className="text-left">
                      <h4 className="font-semibold">Count Mismatch</h4>
                      <p className="text-sm">
                        You expected {expectedGenomeCount} genomes, but we found {fastaHeaders.length}.
                      </p>
                      <p className="text-sm mt-1">Do you want to proceed with the detected count or re-select?</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Re-select
                    </Button>
                    <Button type="button" size="sm" onClick={() => onGenomeCountChange?.(fastaHeaders.length)}>
                      Proceed with {fastaHeaders.length}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
