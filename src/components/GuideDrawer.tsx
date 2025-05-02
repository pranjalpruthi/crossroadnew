import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GuideStep {
    title: string;
    description: string;
    image?: string;
}

const guideSteps: GuideStep[] = [
    {
        title: "Upload Your Files",
        description: "Start by uploading your FASTA files. Optionally include TSV categories and BED gene annotations.",
    },
    {
        title: "Configure Analysis",
        description: "Set your analysis parameters, including reference genome and SSR detection settings.",
    },
    {
        title: "Analyze",
        description: "Our pipeline will process your data, detecting SSRs and analyzing patterns across genomes.",
    },
    {
        title: "Explore Results",
        description: "Interact with visualizations, download results, and explore SSR patterns in your data.",
    },
];

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6 }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export function GuideDrawer({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleOpenGuide = () => {
        setIsLoading(true);
        setIsOpen(true);
        setTimeout(() => setIsLoading(false), 500);
    };

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                {children || (
                    <Button 
                        variant="ghost" 
                        className="hover:bg-accent/50 h-9"
                        onClick={handleOpenGuide}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Guide
                            </>
                        )}
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="fixed bottom-0 left-0 right-0 rounded-t-[10px] bg-background/80 backdrop-blur-xl border-t shadow-lg">
                <div className="mx-auto w-full max-w-none md:max-w-none px-4">
                    {/* Handle - only show on mobile */}
                    <div className="sticky top-0 flex w-full items-center justify-center bg-transparent pt-4 md:hidden">
                        <div className="h-1.5 w-12 rounded-full bg-muted" />
                    </div>

                    {/* Adjust height based on screen size */}
                    <div className="h-[80vh] md:h-[70vh] overflow-y-auto overscroll-contain pb-20">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                        >
                            <motion.div variants={fadeIn}>
                                <DrawerHeader className="mt-4">
                                    <DrawerTitle className="text-2xl font-medium">Getting Started with croSSRoad</DrawerTitle>
                                    <DrawerDescription className="text-base text-muted-foreground">
                                        Learn how to use croSSRoad for comprehensive SSR analysis across multiple genomes.
                                    </DrawerDescription>
                                </DrawerHeader>
                            </motion.div>
                            
                            {/* Update layout for desktop */}
                            <div className="mt-6 space-y-8 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
                                {/* Quick Start - full width on mobile, left column on desktop */}
                                <motion.div 
                                    className="md:col-span-1"
                                    variants={fadeIn}
                                >
                                    <h3 className="text-lg font-medium mb-4">Quick Start Guide</h3>
                                    <motion.div 
                                        className="space-y-6"
                                        variants={staggerContainer}
                                    >
                                        {guideSteps.map((step, index) => (
                                            <motion.div
                                                key={step.title}
                                                variants={fadeIn}
                                                className={cn(
                                                    "space-y-3 rounded-lg border bg-card/50 p-4",
                                                    "hover:bg-accent/10 transition-colors"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <h4 className="text-base font-medium">{step.title}</h4>
                                                </div>
                                                <p className="text-sm text-muted-foreground pl-11">{step.description}</p>
                                                {step.image && (
                                                    <img 
                                                        src={step.image} 
                                                        alt={step.title} 
                                                        className="rounded-lg border mt-2 pl-8"
                                                    />
                                                )}
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </motion.div>

                                {/* Right column for desktop */}
                                <motion.div 
                                    className="space-y-8 md:col-span-1"
                                    variants={fadeIn}
                                >
                                    {/* Key Features */}
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Key Features</h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {[
                                                "Compare SSR variations across genomes",
                                                "Identify hotspot genes with SSR variations",
                                                "Trace evolutionary SSR patterns",
                                                "Generate interactive visualizations",
                                                "Analyze conserved SSR markers",
                                                "Export publication-ready results",
                                                "Process multiple genomes efficiently",
                                                "Integrate with gene annotations"
                                            ].map((feature, i) => (
                                                <div 
                                                    key={i} 
                                                    className="rounded-lg border bg-card/50 p-4 hover:bg-accent/10 transition-colors"
                                                >
                                                    <p className="text-sm text-muted-foreground">{feature}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator className="my-8" />

                                    {/* Resources */}
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Additional Resources</h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {[
                                                { title: "Documentation", desc: "Detailed analysis pipeline guide" },
                                                { title: "Example Data", desc: "Sample datasets to explore" },
                                                { title: "CLI Reference", desc: "Command-line interface docs" },
                                                { title: "Publications", desc: "Related research papers" }
                                            ].map((resource, i) => (
                                                <div 
                                                    key={i} 
                                                    className="rounded-lg border bg-card/50 p-4 hover:bg-accent/10 transition-colors"
                                                >
                                                    <h4 className="font-medium mb-1">{resource.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{resource.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
                
                <DrawerFooter className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-xl mt-0">
                    <DrawerClose asChild>
                        <Button 
                            variant="outline" 
                            className="w-full rounded-full md:max-w-[200px]"
                        >
                            Close Guide
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}