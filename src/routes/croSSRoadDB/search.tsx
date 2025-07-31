import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Database, Repeat, Activity, ArrowRight, BarChart3 } from 'lucide-react'

const searchValidation = z.object({
  q: z.string().optional(),
  type: z.enum(['all', 'projects', 'genomes', 'ssrs', 'hotspots']).optional().default('all'),
})

export const Route = createFileRoute('/croSSRoadDB/search')({
  validateSearch: (search) => searchValidation.parse(search),
  component: CrdSearchPage,
})

function CrdSearchPage() {
  const { q, type } = useSearch({ from: Route.id })
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState(q || '')

  // Search projects
  const { data: projectResults, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['search_projects', q],
    queryFn: async () => {
      if (!q) return []

      const { data, error } = await supabase
        .from('projects')
        .select('project_id, project_name, organism_name, description')
        .or(`project_name.ilike.%${q}%,organism_name.ilike.%${q}%,description.ilike.%${q}%`)

      if (error) {
        console.error('Error searching projects:', error)
        return []
      }

      return data || []
    },
    enabled: !!q && (type === 'all' || type === 'projects'),
  })

  // Search merged_out (SSRs)
  const { data: ssrResults, isLoading: isLoadingSSRs } = useQuery({
    queryKey: ['search_ssrs', q],
    queryFn: async () => {
      if (!q) return []

      const { data, error } = await supabase
        .from('merged_out')
        .select('merged_id, genome_id, motif, repeat_count, length_of_ssr, category, optional_category, year, run_id')
        .or(`motif.ilike.%${q}%,genome_id.ilike.%${q}%,category.ilike.%${q}%,optional_category.ilike.%${q}%`)
        .limit(50)

      if (error) {
        console.error('Error searching SSRs:', error)
        return []
      }

      return data || []
    },
    enabled: !!q && (type === 'all' || type === 'ssrs'),
  })

  // Search HSSR data
  const { data: hssrResults, isLoading: isLoadingHSSRs } = useQuery({
    queryKey: ['search_hssrs', q],
    queryFn: async () => {
      if (!q) return []

      const { data, error } = await supabase
        .from('hssr_data')
        .select('hssr_id, genome_id, motif, repeat_count, length_of_ssr, gene, ssr_position, category, optional_category, run_id')
        .or(`motif.ilike.%${q}%,gene.ilike.%${q}%,genome_id.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(50)

      if (error) {
        console.error('Error searching HSSRs:', error)
        return []
      }

      return data || []
    },
    enabled: !!q && (type === 'all' || type === 'ssrs'),
  })

  // Search hotspots
  const { data: hotspotResults, isLoading: isLoadingHotspots } = useQuery({
    queryKey: ['search_hotspots', q],
    queryFn: async () => {
      if (!q) return []

      const { data, error } = await supabase
        .from('mutational_hotspots')
        .select('hotspot_id, motif, gene, length_of_motif, genomeid_count, loci_variations')
        .or(`motif.ilike.%${q}%,gene.ilike.%${q}%`)
        .limit(50)

      if (error) {
        console.error('Error searching hotspots:', error)
        return []
      }

      return data || []
    },
    enabled: !!q && (type === 'all' || type === 'hotspots'),
  })

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate({
        to: '/croSSRoadDB/search',
        search: { q: searchQuery.trim(), type },
      })
    }
  }

  const isLoading = isLoadingProjects || isLoadingSSRs || isLoadingHSSRs || isLoadingHotspots
  const hasResults = (projectResults?.length || 0) + (ssrResults?.length || 0) + (hssrResults?.length || 0) + (hotspotResults?.length || 0) > 0

  return (
    <div className="container mx-auto pt-24 pb-8 sm:py-12 md:py-16 lg:py-20 space-y-6 sm:space-y-8 md:space-y-12 lg:space-y-16 px-4 sm:px-6 max-w-full">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate({ to: '/croSSRoadDB' })}>
            ← Back to Database
          </Button>
        </div>

        <h1 className="text-3xl font-bold">
          {q ? `Search Results for "${q}"` : 'Search croSSRoadDB'}
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder="Search by gene, organism, motif, or genome ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Results */}
      {q && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : hasResults ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  All Results ({(projectResults?.length || 0) + (ssrResults?.length || 0) + (hssrResults?.length || 0) + (hotspotResults?.length || 0)})
                </TabsTrigger>
                {projectResults && projectResults.length > 0 && (
                  <TabsTrigger value="projects">
                    <Database className="mr-1 h-4 w-4" />
                    Projects ({projectResults.length})
                  </TabsTrigger>
                )}
                {ssrResults && ssrResults.length > 0 && (
                  <TabsTrigger value="ssrs">
                    <Repeat className="mr-1 h-4 w-4" />
                    SSRs ({ssrResults.length})
                  </TabsTrigger>
                )}
                {hssrResults && hssrResults.length > 0 && (
                  <TabsTrigger value="hssrs">
                    <BarChart3 className="mr-1 h-4 w-4" />
                    HSSRs ({hssrResults.length})
                  </TabsTrigger>
                )}
                {hotspotResults && hotspotResults.length > 0 && (
                  <TabsTrigger value="hotspots">
                    <Activity className="mr-1 h-4 w-4" />
                    Hotspots ({hotspotResults.length})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {/* Projects */}
                {projectResults && projectResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Projects ({projectResults.length})
                    </h3>
                    <div className="grid gap-4">
                      {projectResults.map((project: any) => (
                        <Card key={project.project_id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-semibold">{project.project_name}</h4>
                                <p className="text-primary font-medium">{project.organism_name}</p>
                                <p className="text-sm text-muted-foreground">{project.description}</p>
                              </div>
                              <Badge variant="outline">Project #{project.project_id}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* HSSRs */}
                {hssrResults && hssrResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      HSSRs ({hssrResults.length})
                    </h3>
                    <div className="grid gap-4">
                      {hssrResults.slice(0, 10).map((hssr: any) => (
                        <Card key={hssr.hssr_id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono">{hssr.motif}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {hssr.repeat_count} repeats, {hssr.length_of_ssr} bp
                                  </span>
                                  <Badge variant="secondary">HSSR</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="font-mono">{hssr.genome_id}</span>
                                  {hssr.gene && <span>Gene: {hssr.gene}</span>}
                                  {hssr.ssr_position && <span>Position: {hssr.ssr_position}</span>}
                                </div>
                              </div>
                              <Badge variant="outline">Run #{hssr.run_id}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* SSRs */}
                {ssrResults && ssrResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Repeat className="h-5 w-5" />
                      SSRs ({ssrResults.length})
                    </h3>
                    <div className="grid gap-4">
                      {ssrResults.slice(0, 10).map((ssr: any) => (
                        <Card key={ssr.merged_id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono">{ssr.motif}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {ssr.repeat_count} repeats, {ssr.length_of_ssr} bp
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="font-mono">{ssr.genome_id}</span>
                                  {ssr.category && <span>{ssr.category}</span>}
                                  {ssr.optional_category && <span>({ssr.optional_category})</span>}
                                  {ssr.year && <span>{ssr.year}</span>}
                                </div>
                              </div>
                              <Badge variant="outline">Run #{ssr.run_id}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hotspots */}
                {hotspotResults && hotspotResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Mutational Hotspots ({hotspotResults.length})
                    </h3>
                    <div className="grid gap-4">
                      {hotspotResults.map((hotspot: any) => (
                        <Card key={hotspot.hotspot_id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono">{hotspot.motif}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Length: {hotspot.length_of_motif} bp
                                  </span>
                                  <Badge variant="secondary">{hotspot.genomeid_count} genomes</Badge>
                                </div>
                                {hotspot.gene && (
                                  <p className="text-sm text-muted-foreground">Gene: {hotspot.gene}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Individual tabs for each result type */}
              {projectResults && projectResults.length > 0 && (
                <TabsContent value="projects">
                  <div className="grid gap-4">
                    {projectResults.map((project: any) => (
                      <Card key={project.project_id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="text-xl font-semibold">{project.project_name}</h4>
                              <p className="text-lg text-primary font-medium">{project.organism_name}</p>
                              <p className="text-muted-foreground">{project.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Project #{project.project_id}</Badge>
                              <Button variant="ghost" size="sm">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* Similar detailed tabs for other result types... */}
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No results found</h3>
                    <p className="text-muted-foreground">
                      Try searching for different terms like motif sequences (ATC, GATACA),
                      organism names, or gene identifiers.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('ATC')}>
                      Try "ATC"
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('baumannii')}>
                      Try "baumannii"
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('Mpox')}>
                      Try "Mpox"
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
