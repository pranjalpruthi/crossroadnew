import { cn } from "@/lib/utils";
import { ScriptCopyBtn } from "@/components/magicui/script-copy-btn";

interface InstallationCommandsProps {
  className?: string;
}

export function InstallationCommands({ className }: InstallationCommandsProps) {
  const commandMap = {
    anaconda: "mamba install -c jitendralab -c bioconda -c conda-forge crossroad -y",
    pypi: "pip install crossroad-cli"
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Install croSSRoad CLI</h3>
        <p className="text-sm text-muted-foreground">
          For large-scale genomic analyses, use our command-line toolkit:
        </p>
      </div>
      <ScriptCopyBtn
        showMultiplePackageOptions={true}
        codeLanguage="bash"
        lightTheme="github-light"
        darkTheme="github-dark"
        commandMap={commandMap}
        className="w-full"
      />
      <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Anaconda:</span>
          <a href="https://anaconda.org/jitendralab/crossroad" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            https://anaconda.org/jitendralab/crossroad
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">PyPI:</span>
          <a href="https://pypi.org/project/crossroad-cli/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            https://pypi.org/project/crossroad-cli/
          </a>
        </div>
      </div>
    </div>
  );
} 