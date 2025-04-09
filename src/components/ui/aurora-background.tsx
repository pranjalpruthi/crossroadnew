import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import React from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-background/95 text-foreground transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              `
              [--aurora:repeating-linear-gradient(100deg,var(--magic-primary)_10%,var(--magic-secondary)_15%,var(--magic-accent)_20%)]
              [background-image:var(--aurora)]
              [background-size:300%,_200%]
              [background-position:50%_50%,50%_50%]
              filter blur-[32px]
              after:content-[""] after:absolute after:inset-0 
              after:[background-image:var(--aurora)]
              after:[background-size:200%,_100%] 
              after:animate-aurora after:[background-attachment:fixed]
              pointer-events-none
              absolute -inset-[10px] opacity-50`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
            )}
          />
        </div>
        {children}
      </div>
    </main>
  );
};
