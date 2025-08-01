import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function DatabaseDashboard() {
  // Query for organism distribution
  const { data: organismData, isLoading: isLoadingOrganisms } = useQuery({
    queryKey: ['organism_distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('organism_name, project_id')

      if (!data) return []

      // Get genome counts for each project via analysis_runs
      const projectCounts = await Promise.all(
        data.map(async (project) => {
          const { data: runs } = await supabase
            .from('analysis_runs')
            .select('genomes_used_count')
            .eq('project_id', project.project_id)

          const totalGenomes = runs?.reduce((sum, run) => sum + (run.genomes_used_count || 0), 0) || 0

          return {
            organism: project.organism_name,
            genomes: totalGenomes,
          }
        })
      )

      return projectCounts
    },
  })

  // Query for motif distribution
  const { data: motifData, isLoading: isLoadingMotifs } = useQuery({
    queryKey: ['motif_distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('merged_out')
        .select('motif')
        .limit(1000)

      if (!data) return []

      const motifCounts = data.reduce((acc: Record<string, number>, ssr) => {
        const motif = ssr.motif
        acc[motif] = (acc[motif] || 0) + 1
        return acc
      }, {})

      return Object.entries(motifCounts)
        .map(([motif, count]) => ({ motif, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    },
  })

  // Query for temporal distribution
  const { data: temporalData, isLoading: isLoadingTemporal } = useQuery({
    queryKey: ['temporal_distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('merged_out')
        .select('year')
        .not('year', 'is', null)
        .limit(1000)

      if (!data) return []

      const yearCounts = data.reduce((acc: Record<number, number>, genome) => {
        const year = genome.year
        if (year) {
          acc[year] = (acc[year] || 0) + 1
        }
        return acc
      }, {})

      return Object.entries(yearCounts)
        .map(([year, count]) => ({ year: parseInt(year), count }))
        .sort((a, b) => a.year - b.year)
    },
  })

  // Query for hotspot analysis
  const { data: hotspotData, isLoading: isLoadingHotspots } = useQuery({
    queryKey: ['hotspot_analysis'],
    queryFn: async () => {
      const { data } = await supabase
        .from('mutational_hotspots')
        .select('motif, gene, genomeid_count, length_of_motif')
        .order('genomeid_count', { ascending: false })
        .limit(20)

      return data || []
    },
  })

  // Query for SSR length distribution
  const { data: lengthData, isLoading: isLoadingLength } = useQuery({
    queryKey: ['ssr_length_distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('merged_out')
        .select('length_of_ssr, motif')
        .limit(1000)

      if (!data) return []

      const lengthCounts = data.reduce((acc: Record<number, number>, ssr) => {
        const length = ssr.length_of_ssr
        if (length && length <= 100) { // Filter out extremely long SSRs for visualization
          acc[length] = (acc[length] || 0) + 1
        }
        return acc
      }, {})

      return Object.entries(lengthCounts)
        .map(([length, count]) => ({ length: parseInt(length), count }))
        .sort((a, b) => a.length - b.length)
    },
  })

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Organism Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Genome Distribution by Organism</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrganisms ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={organismData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="organism"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="genomes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Motifs */}
        <Card>
          <CardHeader>
            <CardTitle>Top SSR Motifs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMotifs ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={motifData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ motif, percent }) => `${motif} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {motifData?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Temporal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Temporal Distribution of Genomes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTemporal ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temporalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* SSR Length Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>SSR Length Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLength ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={lengthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="length" name="Length (bp)" />
                  <YAxis dataKey="count" name="Count" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter dataKey="count" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hotspot Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Mutational Hotspots</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHotspots ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <colgroup>
                <col style={{ width: '120px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '180px' }} />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Motif</TableHead>
                  <TableHead className="font-medium">Gene</TableHead>
                  <TableHead className="font-medium">Length</TableHead>
                  <TableHead className="font-medium">Genomes</TableHead>
                  <TableHead className="font-medium">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotspotData?.map((hotspot, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {hotspot.motif}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="truncate" title={hotspot.gene || 'N/A'}>
                        {hotspot.gene || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{hotspot.length_of_motif}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {hotspot.genomeid_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2 min-w-[60px]">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (hotspot.genomeid_count / 50) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {((hotspot.genomeid_count / 50) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}