import { cn } from "@/lib/utils";
import { ScriptCopyBtn } from "@/components/magicui/script-copy-btn";

interface InstallationCommandsProps {
  className?: string;
}

export function InstallationCommands({ className }: InstallationCommandsProps) {
  const commandMap = {
    mamba: "mamba install -c jitendralab -c bioconda -c conda-forge crossroad -y",
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
        showMultiplePackageOptions={false}
        codeLanguage="bash"
        lightTheme="github-light"
        darkTheme="github-dark"
        commandMap={commandMap}
        className="w-full"
      />
      <div className="text-xs text-muted-foreground">
        <span className="font-semibold">Conda package: </span>
        <a
          href="https://anaconda.org/channels/jitendralab/packages/crossroad/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          anaconda.org/jitendralab/crossroad
        </a>
      </div>
    </div>
  );
}
