import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import Devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Re-export everything from react-query
export * from '@tanstack/react-query';
// Re-export Devtools
export { ReactQueryDevtools };

const queryClient = new QueryClient()

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export const getContext = () => ({
  queryClient,
})
