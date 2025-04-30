/**
 * WorkerPool - Manages a pool of web workers for parallel data processing
 * 
 * This utility creates and manages a pool of web workers to efficiently
 * distribute CPU-intensive tasks across multiple workers, improving UI responsiveness.
 */

// Define message types for type safety
export type WorkerTask = {
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

export type WorkerResult = {
  id: string;
  status: 'success' | 'error';
  result?: any;
  error?: string;
};

export class WorkerPool {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private taskQueue: { task: WorkerTask; resolve: (value: any) => void; reject: (reason: any) => void }[] = [];
  private taskMap = new Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }>();

  constructor(private numWorkers: number = navigator.hardwareConcurrency || 4) {
    this.initialize();
  }

  /**
   * Initialize the worker pool by creating the specified number of workers
   */
  private initialize(): void {
    // Create workers and set up message handlers
    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker(new URL('./dataProcessingWorker.ts', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e: MessageEvent<WorkerResult>) => {
        const result = e.data;
        // Get the promise handlers for this task
        const handlers = this.taskMap.get(result.id);
        
        if (handlers) {
          if (result.status === 'success') {
            handlers.resolve(result.result);
          } else {
            handlers.reject(new Error(result.error || 'Unknown worker error'));
          }
          this.taskMap.delete(result.id);
        }
        
        // Put the worker back in the idle pool
        this.idleWorkers.push(worker);
        
        // Process the next task if any are queued
        this.processNextTask();
      };
      
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Put the worker back in the idle pool
        this.idleWorkers.push(worker);
        // Process the next task
        this.processNextTask();
      };
      
      this.workers.push(worker);
      this.idleWorkers.push(worker);
    }
  }

  /**
   * Execute a task in one of the workers
   * @param task The task to execute
   * @returns A promise that resolves with the task result
   */
  public executeTask<T = any>(task: WorkerTask): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add task to the queue
      this.taskQueue.push({ task, resolve, reject });
      // Store the promise handlers
      this.taskMap.set(task.id, { resolve, reject });
      // Try to process it immediately
      this.processNextTask();
    });
  }

  /**
   * Process the next task in the queue if there are idle workers
   */
  private processNextTask(): void {
    // If we have idle workers and tasks, process the next one
    if (this.idleWorkers.length > 0 && this.taskQueue.length > 0) {
      const worker = this.idleWorkers.pop()!;
      const { task } = this.taskQueue.shift()!;
      
      // Send the task to the worker
      worker.postMessage(task);
    }
  }

  /**
   * Generate a unique task ID
   * @returns A unique task ID string
   */
  public static generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Terminate all workers and clear the queue
   */
  public terminate(): void {
    // Terminate all workers
    this.workers.forEach(worker => worker.terminate());
    
    // Reject all pending tasks
    this.taskQueue.forEach(({ reject }) => {
      reject(new Error('Worker pool terminated'));
    });
    
    // Clear arrays
    this.workers = [];
    this.idleWorkers = [];
    this.taskQueue = [];
    this.taskMap.clear();
  }
} 