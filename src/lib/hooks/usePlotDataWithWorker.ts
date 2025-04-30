/**
 * usePlotDataWithWorker - Custom hook for processing data for plots using web workers
 *
 * This hook extends useDataProcessing to provide specific functionality for plot data,
 * automatically handling the most common plot data transformations.
 */

import { useState, useEffect } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import { useDataProcessing } from './useDataProcessing';

export interface PlotDataOptions {
  /**
   * Reference ID for plots that need it (like reference distribution)
   */
  referenceId?: string | null;
  /**
   * Enable performance logging
   */
  enablePerfLogging?: boolean;
}

export interface UsePlotDataResult<TRawData = any, TProcessedData = any> {
  /**
   * Raw data (parsed from Arrow but not transformed)
   */
  rawData: TRawData[] | null;
  /**
   * Processed data for plot visualization
   */
  plotData: TProcessedData | null;
  /**
   * Whether the data is currently being processed
   */
  isProcessing: boolean;
  /**
   * Any error that occurred during processing
   */
  error: Error | null;
  /**
   * Function to manually transform data for a specific plot type
   */
  transformForPlotType: (plotType: string, data?: TRawData[] | null) => Promise<TProcessedData | null>;
}

/**
 * Hook for processing plot data using web workers
 */
export function usePlotDataWithWorker<TRawData = any, TProcessedData = any>(
  queryResult: UseQueryResult<any>,
  plotType: string,
  options: PlotDataOptions = {}
): UsePlotDataResult<TRawData, TProcessedData> {
  const { referenceId, enablePerfLogging = true } = options;
  
  const [plotData, setPlotData] = useState<TProcessedData | null>(null);
  
  // Use the base data processing hook
  const {
    data: rawData,
    isProcessing: isBaseProcessing,
    error,
    parseArrowData,
    transformForPlot,
  } = useDataProcessing<TRawData>({ enablePerfLogging });
  
  // Track if we're processing plot-specific transformations
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const isProcessing = isBaseProcessing || isTransforming;
  
  // Parse raw data when query result changes
  useEffect(() => {
    if (queryResult.isSuccess && queryResult.data?.data) {
      parseArrowData(queryResult);
    }
  }, [queryResult.isSuccess, queryResult.data, parseArrowData]);
  
  // Transform data for the plot when raw data changes
  useEffect(() => {
    if (rawData && rawData.length > 0 && plotType) {
      setIsTransforming(true);
      
      transformForPlot(rawData, plotType, referenceId)
        .then(transformedData => {
          setPlotData(transformedData as TProcessedData);
        })
        .catch(error => {
          console.error(`Error transforming data for ${plotType}:`, error);
        })
        .finally(() => {
          setIsTransforming(false);
        });
    }
  }, [rawData, plotType, referenceId, transformForPlot]);
  
  /**
   * Transform data for a specific plot type (can be called manually if needed)
   */
  const transformForPlotType = async (
    newPlotType: string,
    dataToTransform: TRawData[] | null = rawData
  ): Promise<TProcessedData | null> => {
    if (!dataToTransform || dataToTransform.length === 0) {
      return null;
    }
    
    setIsTransforming(true);
    
    try {
      const result = await transformForPlot(
        dataToTransform,
        newPlotType,
        referenceId
      );
      
      return result as TProcessedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Error in manual transformation for ${newPlotType}:`, error);
      throw error;
    } finally {
      setIsTransforming(false);
    }
  };
  
  return {
    rawData,
    plotData,
    isProcessing,
    error,
    transformForPlotType,
  };
} 