import { createFileRoute, Outlet, useMatches, useNavigate } from '@tanstack/react-router';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DashNav } from '@/components/dashboard/dashnav';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from 'react';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
});

function DashboardBreadcrumbs() {
  const matches = useMatches()
  const navigate = useNavigate()
  
  // Filter out root path and get meaningful route segments
  const breadcrumbs = matches
    .filter((match) => match.pathname !== '/')
    .map((match) => ({
      label: match.pathname.split('/').pop() || 'Dashboard',
      path: match.pathname,
    }))

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>
                  {crumb.label.charAt(0).toUpperCase() + crumb.label.slice(1)}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink 
                  onClick={() => navigate({ to: crumb.path })}
                  className="cursor-pointer"
                >
                  {crumb.label.charAt(0).toUpperCase() + crumb.label.slice(1)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function DashboardLayout() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <DashNav />
          <div className="flex-1">
            <SidebarInset className="min-h-screen">
              <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <DashboardBreadcrumbs />
                  </div>
                </div>
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
} 