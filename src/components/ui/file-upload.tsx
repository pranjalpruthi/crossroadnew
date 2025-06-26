import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, File as FileIcon, List, AlertTriangle, RefreshCw } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

type UploadStep = "initial" | "uploading" | "validating" | "results";

export const FileUpload = ({
  onChange,
  accept,
  required,
  title = "Upload file",
  description = "Drag or drop your files here or click to upload",
  fileTypeHint,
  uploadProgress = null,
}: {
  onChange?: (files: File[] | null) => void;
  accept?: string;
  required?: boolean;
  title?: string;
  description?: string;
  fileTypeHint?: 'fasta' | 'tsv' | 'bed';
  uploadProgress?: number | null;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<UploadStep>("initial");
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadProgress !== null && uploadProgress > 0 && uploadProgress < 100) {
      setStep("uploading");
      setUploadComplete(false);
    } else if (uploadProgress === 100) {
      setUploadComplete(true);
      if (step === "uploading") {
        setTimeout(() => {
          setStep("results");
        }, 1000);
      }
    }
  }, [uploadProgress, step]);

  const handleFileChange = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    
    setFiles(newFiles);
    onChange?.(newFiles);
    setStep("validating");
    setError(null);
    setUploadComplete(false);
    
    const file = newFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const firstLine = content.split('\n')[0];
      const parsedHeaders = firstLine.split('\t').map(h => h.trim());

      if (fileTypeHint !== 'fasta' && parsedHeaders.length !== 4) {
        setError(`Expected 4 columns, but found ${parsedHeaders.length}. Please provide a 4-column, tab-separated file.`);
      }
      
      setHeaders(parsedHeaders);
      setStep("results");
    };
    
    reader.onerror = () => {
        setError("Failed to read the file.");
        setStep("results");
    };

    reader.readAsText(file);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles([]);
    setHeaders([]);
    setError(null);
    setUploadComplete(false);
    setStep("initial");
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    accept: accept ? { [accept]: [] } : undefined,
  });

  const handleClick = () => {
    if (step === 'initial') {
      fileInputRef.current?.click();
    }
  };

  const typeSpecificClasses = {
    fasta: "from-green-500/10 to-green-600/10 border-green-200/80 dark:border-green-800/70 hover:border-green-500/40",
    tsv: "from-blue-500/10 to-blue-600/10 border-blue-200/80 dark:border-blue-800/70 hover:border-blue-500/40",
    bed: "from-purple-500/10 to-purple-600/10 border-purple-200/80 dark:border-purple-800/70 hover:border-purple-500/40",
  };
  const defaultClasses = "from-gray-500/10 to-gray-600/10 border-gray-200/80 dark:border-gray-800/70 hover:border-primary/40";

  return (
    <div {...getRootProps()} className="w-full">
      <motion.div
        onClick={handleClick}
        whileHover={step === 'initial' ? "animate" : ""}
        className={cn(
          "p-3 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden bg-gradient-to-br backdrop-blur-sm border transition-all",
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
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            {step === "initial" && (
              <div className="flex flex-col items-center justify-center text-center">
                <p className="relative z-20 font-sans font-bold text-[hsl(222.2_84%_4.9%)] dark:text-[hsl(240_33%_99%)] text-sm">
                  {title} {required && <span className="text-[hsl(221_83%_53%)]">*</span>}
                </p>
                <p className="relative z-20 font-sans font-normal text-[hsl(222.2_84%_4.9%)]/70 dark:text-[hsl(240_33%_99%)]/70 text-xs mt-1">
                  {description}
                </p>
                <div className="relative w-full mt-4 max-w-xl mx-auto">
                  <motion.div
                    layoutId={`file-upload-empty-${title}`}
                    variants={mainVariant}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative group-hover/file:shadow-2xl z-50 bg-white dark:bg-[hsl(240_33%_99%)]/5 flex items-center justify-center h-12 mt-1 w-full max-w-[7rem] mx-auto rounded-md shadow-[0px_8px_40px_rgba(0,0,0,0.08)] border border-[hsl(214.3_31.8%_91.4%)] dark:border-[hsl(214.3_31.8%_91.4%)]/20"
                  >
                    {isDragActive ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[hsl(222.2_84%_4.9%)] dark:text-[hsl(240_33%_99%)] flex flex-col items-center text-xs"
                      >
                        Drop it
                        <Upload className="h-4 w-4 text-[hsl(221_83%_60%)] dark:text-[hsl(262_83%_65%)] mt-0.5" />
                      </motion.p>
                    ) : (
                      <Upload className="h-5 w-5 text-[hsl(221_83%_60%)] dark:text-[hsl(262_83%_65%)] opacity-75 group-hover/file:opacity-100 transition-opacity" />
                    )}
                  </motion.div>
                  <motion.div
                    variants={secondaryVariant}
                    className="absolute opacity-0 border border-dashed border-[hsl(221_83%_53%)] dark:border-[hsl(262_83%_58%)] inset-0 z-30 bg-transparent flex items-center justify-center h-12 mt-1 w-full max-w-[7rem] mx-auto rounded-md"
                  ></motion.div>
                </div>
              </div>
            )}
            
            {step === "uploading" && (
               <div className="w-full text-left" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">{files[0]?.name || 'Uploading...'}</h3>
                          <p className="text-xs text-muted-foreground">{(files[0]?.size / (1024 * 1024) || 0).toFixed(2)} MB</p>
                      </div>
                  </div>
                  <div className="w-full mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <motion.div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.5 }}
                      />
                      </div>
                      <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-center mt-1 font-semibold text-gray-600 dark:text-gray-300"
                      >
                      {Math.round(uploadProgress ?? 0)}% Uploading...
                      </motion.p>
                  </div>
               </div>
            )}

            {step === "validating" && (
              <div className="flex flex-col items-center justify-center text-center min-h-[116px]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-8 w-8 mx-auto mb-2"
                >
                  <FileIcon className="h-full w-full text-primary" />
                </motion.div>
                <h3 className="text-sm font-semibold">Validating File...</h3>
                <p className="text-xs text-muted-foreground">Checking format and headers.</p>
              </div>
            )}

            {step === "results" && files.length > 0 && (
              <div className="w-full text-left" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{files[0].name}</h3>
                      <p className="text-xs text-muted-foreground">{(files[0].size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <List className="mr-2 h-4 w-4" />
                        Headers
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="end">
                      <div className="p-2">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">File Headers</h4>
                          <Badge variant={error ? "destructive" : "secondary"}>{headers.length} found</Badge>
                        </div>
                        <div className="space-y-1">
                          {headers.map((header, index) => (
                            <div key={index} className="flex items-center text-xs p-1.5 bg-muted/50 rounded">
                              <span className="font-mono truncate">{header}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {uploadComplete && !error && (
                  <div className="w-full mt-2 flex items-center justify-center text-green-500 text-xs">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <p className="font-semibold">File Ready</p>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-2.5 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <h4 className="font-semibold text-sm">Validation Warning</h4>
                        <p className="text-xs">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end mt-3">
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RefreshCw className="mr-2 h-3 w-3" /> Change File
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-[hsl(240_33%_99%)]/50 dark:bg-[hsl(222.2_84%_4.9%)]/5 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-[hsl(240_33%_99%)]/30 dark:bg-[hsl(222.2_84%_4.9%)]/5"
                  : "bg-[hsl(240_33%_99%)]/30 dark:bg-[hsl(222.2_84%_4.9%)]/5 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
