import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about/')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      <p className="text-lg text-gray-700 mb-4">
        Welcome to our TanStack Router application! This is a modern React app built with:
      </p>
      <ul className="list-disc list-inside space-y-2 text-gray-600">
        <li>File-based routing with TanStack Router</li>
        <li>Data fetching with TanStack Query</li>
        <li>Styling with Tailwind CSS</li>
        <li>Component library with Shadcn UI</li>
      </ul>
    </div>
  )
} 