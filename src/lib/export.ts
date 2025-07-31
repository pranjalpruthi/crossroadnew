import { supabase } from './supabase'

export interface ExportOptions {
  projectId?: string
  runId?: string
  format: 'csv' | 'json' | 'tsv'
  tables: ('projects' | 'genomes' | 'ssrs' | 'hotspots')[]
}

export async function exportData(options: ExportOptions) {
  const { projectId, runId, format, tables } = options
  const results: { [key: string]: any[] } = {}

  try {
    // Export projects
    if (tables.includes('projects')) {
      let query = supabase.from('projects').select('*')
      if (projectId) {
        query = query.eq('project_id', projectId)
      }
      const { data, error } = await query
      if (error) throw error
      results.projects = data || []
    }

    // Export genomes
    if (tables.includes('genomes')) {
      let query = supabase.from('genomes').select(`
        *,
        projects!inner(project_name, organism_name)
      `)
      if (runId) {
        query = query.eq('run_id', runId)
      } else if (projectId) {
        query = query.eq('projects.project_id', projectId)
      }
      const { data, error } = await query.limit(10000)
      if (error) throw error
      results.genomes = data || []
    }

    // Export SSRs
    if (tables.includes('ssrs')) {
      let query = supabase.from('ssrs').select(`
        *,
        genomes!inner(category, projects!inner(organism_name))
      `)
      if (runId) {
        query = query.eq('run_id', runId)
      }
      const { data, error } = await query.limit(50000)
      if (error) throw error
      results.ssrs = data || []
    }

    // Export hotspots
    if (tables.includes('hotspots')) {
      let query = supabase.from('mutational_hotspots').select(`
        *,
        analysis_runs!inner(projects!inner(organism_name))
      `)
      if (runId) {
        query = query.eq('run_id', runId)
      }
      const { data, error } = await query.limit(10000)
      if (error) throw error
      results.hotspots = data || []
    }

    // Format and download
    if (format === 'json') {
      downloadJSON(results, `crossroad_export_${Date.now()}`)
    } else {
      // For CSV/TSV, export each table separately
      const delimiter = format === 'csv' ? ',' : '\t'
      for (const [tableName, tableData] of Object.entries(results)) {
        if (tableData.length > 0) {
          downloadCSV(tableData, `${tableName}_${Date.now()}`, delimiter)
        }
      }
    }

    return { success: true, recordCount: Object.values(results).reduce((sum, arr) => sum + arr.length, 0) }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function downloadCSV(data: any[], filename: string, delimiter: string = ',') {
  if (data.length === 0) return

  // Flatten nested objects for CSV export
  const flattenedData = data.map(item => flattenObject(item))
  
  const headers = Object.keys(flattenedData[0])
  const csvContent = [
    headers.join(delimiter),
    ...flattenedData.map(row => 
      headers.map(header => {
        const value = row[header]
        const stringValue = value === null || value === undefined ? '' : String(value)
        // Escape quotes and wrap in quotes if contains delimiter
        if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(delimiter)
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.${delimiter === ',' ? 'csv' : 'tsv'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function flattenObject(obj: any, prefix: string = ''): any {
  const flattened: any = {}
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}_${key}` : key
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(value, newKey))
      } else if (Array.isArray(value)) {
        // Convert arrays to JSON strings
        flattened[newKey] = JSON.stringify(value)
      } else {
        flattened[newKey] = value
      }
    }
  }
  
  return flattened
}

// Quick export functions for common use cases
export async function exportProject(projectId: string, format: 'csv' | 'json' | 'tsv' = 'csv') {
  return exportData({
    projectId,
    format,
    tables: ['projects', 'genomes', 'ssrs', 'hotspots']
  })
}

export async function exportSSRs(runId?: string, format: 'csv' | 'json' | 'tsv' = 'csv') {
  return exportData({
    runId,
    format,
    tables: ['ssrs']
  })
}

export async function exportHotspots(runId?: string, format: 'csv' | 'json' | 'tsv' = 'csv') {
  return exportData({
    runId,
    format,
    tables: ['hotspots']
  })
}