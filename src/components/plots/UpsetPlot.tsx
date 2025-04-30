// Simplified UpsetPlot using Vega-Lite via react-vega
import React, { useEffect } from 'react';
import { VegaLite } from 'react-vega';
import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, Maximize2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PlotSourceDataRow {
  motif?: string | null;
  category?: string | null;
  [key: string]: any;
}

type QueryFnData = {
  plotKey: string;
  data: PlotSourceDataRow[] | null;
  error?: string;
};

interface UpsetPlotProps {
  queryResult: UseQueryResult<QueryFnData, Error>;
}

const UpsetPlot: React.FC<UpsetPlotProps> = ({ queryResult }) => {
  const { data: queryData, isLoading, isError, error } = queryResult;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading UpSet Plot...</CardTitle></CardHeader>
        <CardContent><Skeleton /></CardContent>
      </Card>
    );
  }

  if (isError || !queryData?.data) {
    return (
      <Card>
        <CardHeader><CardTitle>Error Loading UpSet Plot</CardTitle></CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message || 'Unknown error'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Build motif -> set of categories
  const motifMap = new Map<string, Set<string>>();
  queryData.data
    .filter(row => row.motif && row.category)
    .forEach(({ motif, category }) => {
      if (!motifMap.has(motif!)) motifMap.set(motif!, new Set());
      motifMap.get(motif!)!.add(category!);
    });

  // Count each unique combination
  const comboMap = new Map<string, number>();
  motifMap.forEach(catSet => {
    const key = Array.from(catSet).sort().join(';');
    comboMap.set(key, (comboMap.get(key) ?? 0) + 1);
  });

  const values = Array.from(comboMap, ([combination, count]) => ({ combination, count }));

  // Get unique categories
  const categories = Array.from(new Set(queryData.data.map(d => d.category!)));
  // Sort combinations by count descending
  const sortedCombinations = values
    .sort((a, b) => b.count - a.count)
    .map(v => v.combination);
  // Build presence data for dot matrix
  const presenceData = sortedCombinations.flatMap(combination => {
    const presentSet = combination.split(';');
    return categories.map(category => ({
      combination,
      category,
      presence: presentSet.includes(category) ? 1 : 0
    }));
  });

  // Compute summary statistics
  const stats = {
    totalCategories: categories.length,
    uniqueMotifs: motifMap.size,
    totalIntersections: values.length,
  };

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    const chartDiv = document.getElementById('upset-chart');
    if (chartDiv) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        chartDiv.requestFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const chartDiv = document.getElementById('upset-chart');
      if (chartDiv && document.fullscreenElement === chartDiv) {
        // adjust chart container styles
        chartDiv.style.height = '100vh';
        chartDiv.style.padding = '20px';
        chartDiv.style.background = '#ffffff';
      } else if (chartDiv) {
        chartDiv.style.height = 'auto';
        chartDiv.style.padding = '0';
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Vega-Lite spec using vconcat: top bars, bottom dot matrix
  const spec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'UpSet Plot: motif conservation across categories',
    vconcat: [
      {
        width: 800,
        height: 300,
        data: { values },
        mark: 'bar',
        encoding: {
          x: { field: 'combination', type: 'ordinal', title: 'Intersection', sort: sortedCombinations },
          y: { field: 'count', type: 'quantitative', title: 'Motif Count' },
          tooltip: [
            { field: 'combination', type: 'ordinal', title: 'Intersection' },
            { field: 'count', type: 'quantitative', title: 'Count' }
          ]
        }
      },
      {
        width: 800,
        height: 200,
        data: { values: presenceData },
        transform: [ { filter: 'datum.presence === 1' } ],
        mark: { type: 'circle', filled: true, size: 100 },
        encoding: {
          x: { field: 'combination', type: 'ordinal', axis: null, sort: sortedCombinations },
          y: { field: 'category', type: 'nominal', title: '', sort: categories },
          color: { value: '#0ea5e9' },
          tooltip: [
            { field: 'combination', type: 'ordinal', title: 'Intersection' },
            { field: 'category', type: 'nominal', title: 'Category' }
          ]
        }
      }
    ]
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="text-lg flex items-center">UpSet Plot</CardTitle>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4" />
                <span className="ml-2">Stats</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs">
              <div className="space-y-2 p-2">
                <p className="font-medium text-sm mb-2 text-center">Summary Statistics</p>
                <Separator className="mb-3" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Categories:</span>
                  <Badge variant="secondary">{stats.totalCategories}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unique Motifs:</span>
                  <Badge variant="secondary">{stats.uniqueMotifs}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Intersections:</span>
                  <Badge variant="secondary">{stats.totalIntersections}</Badge>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
            <span className="ml-2">Fullscreen</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="upset-chart" className="relative">
          <VegaLite spec={spec} />
        </div>
      </CardContent>
    </Card>
  );
};

export default UpsetPlot;