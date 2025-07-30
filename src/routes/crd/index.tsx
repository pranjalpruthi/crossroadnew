import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Dna, Database, Repeat, MapPin, TestTube } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export const Route = createFileRoute('/crd/')({
  component: CrdDbPage,
})

function CrdDbPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['crd_stats'],
    queryFn: async () => {
      const [
        { count: organismsCount },
        { count: genomesCount },
        { count: ssrsCount },
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('genomes').select('*', { count: 'exact', head: true }),
        supabase.from('mutational_hotspots').select('*', { count: 'exact', head: true }),
      ])
      return {
        organisms: organismsCount ?? 0,
        genomes: genomesCount ?? 0,
        ssrs: ssrsCount ?? 0,
      }
    },
  })

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate({
        to: '/crd/search',
        search: { q: searchQuery },
      })
    }
  }

  return (
    <div className="container mx-auto pt-24 pb-8 sm:py-12 md:py-16 lg:py-20 space-y-6 sm:space-y-8 md:space-y-12 lg:space-y-16 px-4 sm:px-6 max-w-full">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          croSSRoadDB
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          Search the cross-species Simple Sequence Repeats database.
        </p>

        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search by gene, organism, or SSR motif..."
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

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organisms</CardTitle>
              <Dna className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.organisms.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Genomes</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.genomes.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mutational SSRs</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.ssrs.toLocaleString() ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 w-full max-w-5xl text-center">
          <h3 className="text-lg font-semibold mb-4">Filter by Category</h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>Country</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TestTube className="h-5 w-5" />
              <span>Specimen Source</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
