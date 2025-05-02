import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GuideDrawerProps {
  children: React.ReactNode
}

export function GuideDrawer({ children }: GuideDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="fixed bottom-0 left-0 right-0 h-[85vh] sm:h-[80vh]">
        <DrawerHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DrawerTitle>Guide</DrawerTitle>
          <DrawerDescription>
            Learn how to use croSSRoad effectively
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[calc(100vh-15vh-8rem)] px-4">
          <div className="space-y-6 pb-6">
            <section>
              <h3 className="text-lg font-semibold">Getting Started</h3>
              <p className="text-muted-foreground mt-2">
                Welcome to croSSRoad! This guide will help you understand how to use the tool effectively for your SSR analysis needs.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">Basic Usage</h3>
              <p className="text-muted-foreground mt-2">
                1. Upload your FASTA files<br />
                2. Configure analysis parameters<br />
                3. Run the analysis<br />
                4. Explore and download results
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">Advanced Features</h3>
              <p className="text-muted-foreground mt-2">
                - Comparative genomics analysis<br />
                - Hotspot identification<br />
                - Motif distribution analysis<br />
                - Interactive visualizations
              </p>
            </section>

            {/* Add more sections as needed */}
          </div>
        </ScrollArea>
        <DrawerFooter className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button variant="outline" className="w-full">Close Guide</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
} 