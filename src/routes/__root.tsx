import { createRootRoute, Outlet, useMatches } from '@tanstack/react-router'
import { ThemeProvider } from '@/components/theme-provider'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TanstackQueryLayout from '../integrations/tanstack-query/layout'
import { Provider as TanstackQueryProvider } from '../integrations/tanstack-query/provider'

export const Route = createRootRoute({
  component: () => {
    const matches = useMatches()
    // Check if any of the matched routes starts with '/dashboard'
    const isDashboardRoute = matches.some(match => 
      match.routeId.startsWith('/dashboard')
    )

    return (
      <ThemeProvider defaultTheme="system">
        <TanstackQueryProvider>
          <div className="min-h-screen flex flex-col bg-background">
            {!isDashboardRoute && <Navbar />}
            <main className="flex-1">
              <Outlet />
            </main>
            {!isDashboardRoute && <Footer />}
            <TanstackQueryLayout />
          </div>
        </TanstackQueryProvider>
      </ThemeProvider>
    );
  },
});
