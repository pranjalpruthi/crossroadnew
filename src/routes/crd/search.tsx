import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const searchValidation = z.object({
  q: z.string().optional(),
})

export const Route = createFileRoute('/crd/search')({
  validateSearch: (search) => searchValidation.parse(search),
  component: CrdSearchPage,
})

function CrdSearchPage() {
  const { q } = useSearch({ from: Route.id })

  const { data, isLoading } = useQuery({
    queryKey: ['crd_search', q],
    queryFn: async () => {
      if (!q) return []

      const { data: projects, error } = await supabase
        .from('projects')
        .select('project_id, project_name, organism_name, description')
        .textSearch('project_name', `'${q}'`)

      if (error) {
        console.error('Error searching projects:', error)
        return []
      }

      return projects
    },
    enabled: !!q,
  })

  return (
    <div className="container mx-auto pt-24 pb-8 sm:py-12 md:py-16 lg:py-20 space-y-6 sm:space-y-8 md:space-y-12 lg:space-y-16 px-4 sm:px-6 max-w-full">
      <h1 className="text-2xl font-bold mb-4">Search Results for "{q}"</h1>
      {isLoading && <p>Loading...</p>}
      {data && data.length > 0 ? (
        <ul className="space-y-4">
          {data.map((project: any) => (
            <li key={project.project_id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{project.project_name}</h2>
              <p className="text-muted-foreground">{project.organism_name}</p>
              <p className="mt-2">{project.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        !isLoading && <p>No results found.</p>
      )}
    </div>
  )
}
