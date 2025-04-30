/* Data Processing Web Worker
 * This worker handles CPU-intensive tasks like:
 * - Converting Arrow format to JavaScript objects
 * - Transforming data for visualizations
 * - Filtering/aggregating large datasets
 */

import { tableFromIPC } from 'apache-arrow';

// Define message types for type safety
type WorkerMessage = {
  id: string;
  task: 'parseArrow' | 'transformForPlot' | 'filterData';
  data: ArrayBuffer | any[];
  options?: {
    plotType?: string;
    filters?: Record<string, any>;
    sortBy?: string;
    referenceId?: string | null;
  };
};

type WorkerResponse = {
  id: string;
  status: 'success' | 'error';
  result?: any;
  error?: string;
};

// Handle incoming messages
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, task, data, options } = e.data;
  
  try {
    let result;
    console.time(`worker-${task}-${id}`);
    
    switch (task) {
      case 'parseArrow':
        result = parseArrowTable(data as ArrayBuffer);
        break;
      
      case 'transformForPlot':
        result = transformDataForPlot(data as any[], options?.plotType, options?.referenceId);
        break;
      
      case 'filterData':
        result = filterDataset(data as any[], options?.filters, options?.sortBy);
        break;
      
      default:
        throw new Error(`Unknown task: ${task}`);
    }
    
    console.timeEnd(`worker-${task}-${id}`);
    
    // Send successful result back to main thread
    self.postMessage({
      id,
      status: 'success',
      result
    } as WorkerResponse);
  } catch (error) {
    // Send error back to main thread
    console.error(`Worker error in task ${task}:`, error);
    self.postMessage({
      id,
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    } as WorkerResponse);
  }
};

// Parse Arrow table to JavaScript objects
function parseArrowTable(buffer: ArrayBuffer): any[] {
  const arrowTable = tableFromIPC(buffer);
  
  // Convert Arrow table to regular JavaScript objects
  // Handle BigInt conversion to strings
  return arrowTable.toArray().map((row: Record<string, any>) => {
    const newRow: { [key: string]: any } = {};
    for (const key in row) {
      newRow[key] = typeof row[key] === 'bigint' ? row[key].toString() : row[key];
    }
    return newRow;
  });
}

// Transform data for different plot types
function transformDataForPlot(data: any[], plotType?: string, referenceId?: string | null): any {
  if (!plotType) return data;
  
  switch (plotType) {
    case 'relativeAbundance':
      return processRelativeAbundanceData(data);
    
    case 'relativeDensity':
      return processRelativeDensityData(data);
    
    case 'ssrGeneIntersection':
      return processSsrGeneIntersectionData(data);
    
    case 'referenceSsrDistribution':
      return processReferenceSsrDistributionData(data, referenceId);
    
    case 'geneCountrySankey':
      return processGeneCountrySankeyData(data);
    
    // Add more plot-specific transformations as needed
    
    default:
      return data;
  }
}

// Filter dataset based on criteria
function filterDataset(data: any[], filters?: Record<string, any>, sortBy?: string): any[] {
  if (!data || !Array.isArray(data)) return [];
  
  let filtered = [...data];
  
  // Apply filters if specified
  if (filters && Object.keys(filters).length > 0) {
    filtered = filtered.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        // Skip undefined filters
        if (value === undefined) return true;
        
        // Handle different filter types
        if (typeof value === 'string') {
          return String(item[key]).toLowerCase().includes(String(value).toLowerCase());
        } else if (Array.isArray(value)) {
          return value.includes(item[key]);
        } else {
          return item[key] === value;
        }
      });
    });
  }
  
  // Apply sorting if specified
  if (sortBy) {
    const [field, direction] = sortBy.split(':');
    filtered.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return direction === 'desc' ? -comparison : comparison;
    });
  }
  
  return filtered;
}

// Plot-specific data transformations
function processRelativeAbundanceData(data: any[]): any {
  // Group data by repeat type and calculate relative abundance
  const groupedData = data.reduce((acc, row) => {
    const repeatType = row.motif_size || 'unknown';
    if (!acc[repeatType]) {
      acc[repeatType] = { count: 0, total: 0 };
    }
    acc[repeatType].count += 1;
    acc[repeatType].total += Number(row.repeat_count || 0);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);
  
  // Format for visualization
  return Object.entries(groupedData).map(entry => {
    const [type, stats] = entry as [string, { count: number; total: number }];
    return {
      repeatType: type,
      count: stats.count,
      abundance: stats.total / stats.count,
    };
  });
}

function processRelativeDensityData(data: any[]): any {
  // Group data by repeat count ranges
  const distribution = data.reduce((acc, row) => {
    const count = Number(row.repeat_count || 0);
    const range = getRepeatCountRange(count);
    if (!acc[range]) acc[range] = 0;
    acc[range] += 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Format for visualization
  return Object.entries(distribution)
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => {
      // Sort by the lower bound of the range
      const aStart = parseInt(a.range.split('-')[0]);
      const bStart = parseInt(b.range.split('-')[0]);
      return aStart - bStart;
    });
}

function processSsrGeneIntersectionData(data: any[]): any {
  // Process data for SSR-Gene intersection visualization
  return data;
}

function processReferenceSsrDistributionData(data: any[], referenceId?: string | null): any {
  // Filter to reference genome if specified
  if (referenceId) {
    data = data.filter(row => row.genome_id === referenceId);
  }
  return data;
}

function processGeneCountrySankeyData(data: any[]): any {
  // Process data for Gene-Country Sankey diagram
  // Create nodes and links for Sankey visualization
  return data;
}

// Helper function to categorize repeat counts into ranges
function getRepeatCountRange(count: number): string {
  if (count < 5) return '1-4';
  if (count < 10) return '5-9';
  if (count < 20) return '10-19';
  if (count < 50) return '20-49';
  return '50+';
} 