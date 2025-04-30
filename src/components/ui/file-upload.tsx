import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

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

export const FileUpload = ({
  onChange,
  accept,
  required,
  title = "Upload file",
  description = "Drag or drop your files here or click to upload",
  fileTypeHint,
}: {
  onChange?: (files: File[]) => void;
  accept?: string;
  required?: boolean;
  title?: string;
  description?: string;
  fileTypeHint?: 'fasta' | 'tsv' | 'bed';
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
    accept: accept ? { 
      [accept.includes('image') ? 'image/*' : accept]: [] 
    } : undefined,
  });

  // Define color classes based on the hint
  const typeSpecificClasses = {
    fasta: "from-green-500/10 to-green-600/10 border-green-200/80 dark:border-green-800/70 hover:border-green-500/40",
    tsv: "from-blue-500/10 to-blue-600/10 border-blue-200/80 dark:border-blue-800/70 hover:border-blue-500/40",
    bed: "from-purple-500/10 to-purple-600/10 border-purple-200/80 dark:border-purple-800/70 hover:border-purple-500/40",
  };
  const defaultClasses = "from-gray-500/10 to-gray-600/10 border-gray-200/80 dark:border-gray-800/70 hover:border-primary/40";

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className={cn(
          "p-4 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden bg-gradient-to-br backdrop-blur-sm border transition-all", // Base classes
          fileTypeHint ? typeSpecificClasses[fileTypeHint] : defaultClasses // Apply conditional classes
        )}
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept={accept}
          required={required}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
          aria-label="File upload"
          title="Upload file"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-[hsl(222.2_84%_4.9%)] dark:text-[hsl(240_33%_99%)] text-sm">
            {title} {required && <span className="text-[hsl(221_83%_53%)]">*</span>}
          </p>
          <p className="relative z-20 font-sans font-normal text-[hsl(222.2_84%_4.9%)]/70 dark:text-[hsl(240_33%_99%)]/70 text-xs mt-1">
            {description}
          </p>
          <div className="relative w-full mt-4 max-w-xl mx-auto">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className={cn(
                    "relative overflow-hidden z-40 bg-white dark:bg-[hsl(240_33%_99%)]/5 flex flex-col items-start justify-start md:h-16 p-2 mt-2 w-full mx-auto rounded-md",
                    "shadow-sm border border-[hsl(214.3_31.8%_91.4%)] dark:border-[hsl(214.3_31.8%_91.4%)]/20"
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="text-base text-[hsl(222.2_84%_4.9%)] dark:text-[hsl(240_33%_99%)] truncate max-w-xs"
                    >
                      {file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-[hsl(222.2_84%_4.9%)] dark:text-[hsl(240_33%_99%)] bg-[hsl(240_33%_99%)]/50 dark:bg-[hsl(222.2_84%_4.9%)]/10 shadow-input"
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>

                  <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-[hsl(222.2_84%_4.9%)]/70 dark:text-[hsl(240_33%_99%)]/70">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="px-1 py-0.5 rounded-md bg-[hsl(240_33%_99%)]/50 dark:bg-[hsl(222.2_84%_4.9%)]/10"
                    >
                      {file.type}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                    >
                      modified{" "}
                      {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-[hsl(240_33%_99%)]/5 flex items-center justify-center h-16 mt-2 w-full max-w-[8rem] mx-auto rounded-md",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)] border border-[hsl(214.3_31.8%_91.4%)] dark:border-[hsl(214.3_31.8%_91.4%)]/20"
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[hsl(222.2_84%_4.9%)] dark:text-[hsl(240_33%_99%)] flex flex-col items-center"
                  >
                    Drop it
                    <Upload className="h-4 w-4 text-[hsl(221_83%_53%)] dark:text-[hsl(262_83%_58%)]" />
                  </motion.p>
                ) : (
                  <Upload className="h-4 w-4 text-[hsl(221_83%_53%)] dark:text-[hsl(262_83%_58%)]" />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-[hsl(221_83%_53%)] dark:border-[hsl(262_83%_58%)] inset-0 z-30 bg-transparent flex items-center justify-center h-16 mt-2 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )}
          </div>
        </div>
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
