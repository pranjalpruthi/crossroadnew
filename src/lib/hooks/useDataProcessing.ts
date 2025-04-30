/**
 * useDataProcessing - Custom hook for offloading data processing to web workers
 *
 * This hook provides methods to parse Arrow data and transform data for visualizations
 * using the worker pool, keeping the UI responsive when dealing with large datasets.
 */

import { useEffect, useState, useRef } from 'react';
import { WorkerPool } from '../workers/workerPool';
import type { WorkerTask } from '../workers/workerPool';
import type { UseQueryResult } from '@tanstack/react-query';

// Create a single shared worker pool instance for the application
let workerPoolInstance: WorkerPool | null = null;

/**
 * Get or create the global worker pool instance
 */
const getWorkerPool = (): WorkerPool => {
  if (!workerPoolInstance) {
    // Use 70% of available cores but at least 2 and at most 8
    const optimalWorkers = Math.max(2, Math.min(8, 
      Math.floor((navigator.hardwareConcurrency || 4) * 0.7)
    ));
    workerPoolInstance = new WorkerPool(optimalWorkers);
  }
  return workerPoolInstance;
};

export interface UseDataProcessingOptions {
  /**
   * If true, the parsing of Arrow data will start automatically when data changes
   */
  parseOnDataChange?: boolean;
  /**
   * If true, console.time will be used to log performance
   */
  enablePerfLogging?: boolean;
}

export interface DataProcessingResult<T = any> {
  /**
   * The processed data
   */
  data: T[] | null;
  /**
   * Whether the data is currently being processed
   */
  isProcessing: boolean;
  /**
   * Any error that occurred during processing
   */
  error: Error | null;
  /**
   * Function to parse Arrow data from a query result
   */
  parseArrowData: (queryResult: UseQueryResult<any>) => Promise<T[] | null>;
  /**
   * Function to transform data for a specific plot type
   */
  transformForPlot: (data: T[], plotType: string, referenceId?: string | null) => Promise<any>;
  /**
   * Function to filter data based on criteria
   */
  filterData: (data: T[], filters?: Record<string, any>, sortBy?: string) => Promise<T[]>;
}

/**
 * Custom hook for offloading data processing to web workers
 */
export function useDataProcessing<T = any>(options: UseDataProcessingOptions = {}): DataProcessingResult<T> {
  const { enablePerfLogging = true } = options;
  
  const [data, setData] = useState<T[] | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const pool = useRef<WorkerPool>(getWorkerPool());
  
  // Cleanup function to handle component unmount
  useEffect(() => {
    return () => {
      // We don't terminate the pool here since it's shared
      // Just clean up any component-specific resources if needed
    };
  }, []);
  
  /**
   * Parse Arrow data from a query result
   */
  const parseArrowData = async (queryResult: UseQueryResult<any>): Promise<T[] | null> => {
    if (!queryResult.data?.data) return null;
    
    // Skip processing if no actual data is available
    if (!Array.isArray(queryResult.data.data) || queryResult.data.data.length === 0) {
      return [];
    }
    
    if (enablePerfLogging) console.time('parseArrowData');
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // If data is already parsed (array of objects), just return it
      if (typeof queryResult.data.data[0] === 'object') {
        const result = queryResult.data.data as T[];
        setData(result);
        return result;
      }
      
      // Otherwise, assume it's Arrow format and needs parsing
      const task: WorkerTask = {
        id: WorkerPool.generateTaskId(),
        task: 'parseArrow',
        data: queryResult.data.data
      };
      
      const parsedData = await pool.current.executeTask<T[]>(task);
      setData(parsedData);
      return parsedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error parsing Arrow data:', error);
      return null;
    } finally {
      setIsProcessing(false);
      if (enablePerfLogging) console.timeEnd('parseArrowData');
    }
  };
  
  /**
   * Transform data for a specific plot type
   */
  const transformForPlot = async (
    dataToTransform: T[], 
    plotType: string, 
    referenceId?: string | null
  ): Promise<any> => {
    if (!dataToTransform || dataToTransform.length === 0) return [];
    
    if (enablePerfLogging) console.time(`transformForPlot-${plotType}`);
    
    try {
      setIsProcessing(true);
      
      const task: WorkerTask = {
        id: WorkerPool.generateTaskId(),
        task: 'transformForPlot',
        data: dataToTransform,
        options: { plotType, referenceId }
      };
      
      const result = await pool.current.executeTask(task);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Error transforming data for ${plotType}:`, error);
      throw error;
    } finally {
      setIsProcessing(false);
      if (enablePerfLogging) console.timeEnd(`transformForPlot-${plotType}`);
    }
  };
  
  /**
   * Filter data based on criteria
   */
  const filterData = async (
    dataToFilter: T[], 
    filters?: Record<string, any>, 
    sortBy?: string
  ): Promise<T[]> => {
    if (!dataToFilter || dataToFilter.length === 0) return [];
    
    if (enablePerfLogging) console.time('filterData');
    
    try {
      setIsProcessing(true);
      
      const task: WorkerTask = {
        id: WorkerPool.generateTaskId(),
        task: 'filterData',
        data: dataToFilter,
        options: { filters, sortBy }
      };
      
      const result = await pool.current.executeTask<T[]>(task);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error filtering data:', error);
      throw error;
    } finally {
      setIsProcessing(false);
      if (enablePerfLogging) console.timeEnd('filterData');
    }
  };
  
  return {
    data,
    isProcessing,
    error,
    parseArrowData,
    transformForPlot,
    filterData
  };
} 