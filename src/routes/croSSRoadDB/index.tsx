import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Dna, Database, Repeat, TestTube, BarChart3, Activity, Tag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { DatabaseDashboard } from '@/components/crd/DatabaseDashboard'

export const Route = createFileRoute('/croSSRoadDB/')({
  component: CrdDbPage,
})

function CrdDbPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Enhanced stats query with more detailed information
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['crd_stats'],
    queryFn: async () => {
      const [
        { count: projectsCount },
        { count: analysisRunsCount },
        { count: mergedOutCount },
        { count: hssrDataCount },
        { count: hotspotsCount },
        projectsData,
        analysisRunsData,
        mergedOutSample,
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('analysis_runs').select('*', { count: 'exact', head: true }),
        supabase.from('merged_out').select('*', { count: 'exact', head: true }),
        supabase.from('hssr_data').select('*', { count: 'exact', head: true }),
        supabase.from('mutational_hotspots').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('project_id, project_name, organism_name, description, creation_date'),
        supabase.from('analysis_runs').select('run_id, project_id, genomes_used_count, ssrs_total_count, run_timestamp'),
        supabase.from('merged_out').select('category, optional_category, year, motif').limit(50000),
      ])

      // Process additional stats from actual data
      const uniqueCountries = new Set(mergedOutSample.data?.map(g => g.optional_category).filter(Boolean))
      const uniqueYears = new Set(mergedOutSample.data?.map(g => g.year).filter(Boolean))
      const uniqueMotifs = new Set(mergedOutSample.data?.map(s => s.motif).filter(Boolean))

      // Calculate total genomes from analysis runs
      const totalGenomes = analysisRunsData.data?.reduce((sum, run) => sum + (run.genomes_used_count || 0), 0) || 0

      return {
        projects: projectsCount ?? 0,
        analysisRuns: analysisRunsCount ?? 0,
        genomes: totalGenomes,
        ssrs: mergedOutCount ?? 0,
        hssrs: hssrDataCount ?? 0,
        hotspots: hotspotsCount ?? 0,
        countries: uniqueCountries.size,
        years: uniqueYears.size,
        motifs: uniqueMotifs.size,
        projectsList: projectsData.data || [],
        recentRuns: analysisRunsData.data?.slice(0, 5) || [],
      }
    },
  })

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate({
        to: '/croSSRoadDB/search',
        search: { q: searchQuery, type: 'all' },
      })
    }
  }

  const handleProjectClick = (projectId: number) => {
    navigate({
      to: '/croSSRoadDB/project/$projectId',
      params: { projectId: projectId.toString() },
    })
  }

  return (
    <div className="container mx-auto pt-24 pb-8 sm:py-12 md:py-16 lg:py-20 space-y-6 sm:space-y-8 md:space-y-12 lg:space-y-16 px-4 sm:px-6 max-w-7xl overflow-hidden">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            cro<span className="bg-gradient-to-r from-primary via-primary/75 to-primary/50 bg-clip-text text-transparent">SSR</span>oadDB
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Repository for SSR analysis spanning varied genomes of multiple species and tracking evolutionary patterns</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search by gene, organism, motif, or genome ID..."
              className="w-full pl-10 pr-20 h-12 text-lg rounded-full shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 rounded-full px-6">
              Search
            </Button>
          </div>
        </form>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.projects.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analysis Runs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.analysisRuns.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomes</CardTitle>
              <Dna className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.genomes.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SSRs</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.ssrs.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HSSRs</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.hssrs.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hotspots</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.hotspots.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optional Category</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.countries.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Motif Types</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.motifs.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="dashboard">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Organisms</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.projectsList.map((project: any) => (
                      <div key={project.project_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => handleProjectClick(project.project_id)}>
                        <div>
                          <h4 className="font-medium">{project.organism_name}</h4>
                          <p className="text-sm text-muted-foreground">{project.project_name}</p>
                        </div>
                        <Badge variant="outline">View</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: '/croSSRoadDB/search', search: { q: 'ATC', type: 'all' } })}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search ATC motifs
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: '/croSSRoadDB/search', search: { q: 'hotspot', type: 'hotspots' } })}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Browse hotspots
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: '/croSSRoadDB/search', search: { q: 'OPG', type: 'all' } })}
                >
                  <Dna className="mr-2 h-4 w-4" />
                  Explore genes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoadingStats ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              stats?.projectsList.map((project: any) => (
                <Card key={project.project_id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleProjectClick(project.project_id)}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {project.project_name}
                      <Badge variant="secondary">
                        <Database className="mr-1 h-3 w-3" />
                        ID: {project.project_id}
                      </Badge>
                    </CardTitle>
                    <p className="text-lg font-medium text-primary">{project.organism_name}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{project.description}</p>
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" size="sm">
                        Explore Data →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <DatabaseDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
