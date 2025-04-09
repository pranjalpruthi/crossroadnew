import { Link } from '@tanstack/react-router'
import { cn } from "@/lib/utils"
import React, { useState } from "react"
import { 
  Home,
  Users,
  Settings,
  BarChart,
  Sun,
  Moon,
  ChevronsUpDown,
  Check,
  Building2,
  LogOut,
  Sparkles,
  BadgeCheck,
  CreditCard,
  Bell,
  Monitor,
  Palette,
  Wand2
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useNavigate } from "@tanstack/react-router"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ModeToggle } from "@/components/mode-toggle"

const navigationLinks = [
  { label: "Dashboard", to: "/dashboard", icon: <Home className="h-4 w-4" /> },
  { label: "Analytics", to: "/dashboard/analytics", icon: <BarChart className="h-4 w-4" /> },
  { label: "Users", to: "/dashboard/users", icon: <Users className="h-4 w-4" /> },
  { label: "Settings", to: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
]

const organizations = [
  {
    label: "Acme Inc",
    value: "acme",
    icon: "/acme-logo.png",
  },
  {
    label: "Monsters Inc",
    value: "monsters",
    icon: "/monsters-logo.png",
  },
  {
    label: "Stark Industries",
    value: "stark",
    icon: "/stark-logo.png",
  }
]

const OrganizationSwitcher = () => {
  const { state } = useSidebar()
  const [open, setOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState(organizations[0])
  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={selectedOrg.icon} alt={selectedOrg.label} />
                <AvatarFallback className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Building2 className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{selectedOrg.label}</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              )}
              {!isCollapsed && <ChevronsUpDown className="ml-auto h-4 w-4" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isCollapsed ? "right" : "bottom"}
            align={isCollapsed ? "start" : "end"}
            sideOffset={4}
          >
            <Command>
              <CommandInput placeholder="Search organization..." />
              <CommandList>
                <CommandEmpty>No organization found.</CommandEmpty>
                <CommandGroup>
                  {organizations.map((org) => (
                    <CommandItem
                      key={org.value}
                      onSelect={() => {
                        setSelectedOrg(org)
                        setOpen(false)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={org.icon} alt={org.label} />
                        <AvatarFallback className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                          <Building2 className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1">
                        <span className="font-medium">{org.label}</span>
                        <span className="text-xs text-muted-foreground">Enterprise</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedOrg.value === org.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const AnnouncementCard = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative cursor-pointer hover:opacity-90 transition-opacity">
          <div className="absolute -top-1 -right-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </div>
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">New Features</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xs text-muted-foreground">
                Check out our latest platform updates!
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Latest Updates</DialogTitle>
        </DialogHeader>
        <Carousel className="w-full max-w-xs mx-auto">
          <CarouselContent>
            {[1, 2, 3].map((_, index) => (
              <CarouselItem key={index}>
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">Feature {index + 1}</span>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DialogContent>
    </Dialog>
  )
}

const UserSwitcher = () => {
  const { state, isMobile } = useSidebar()
  const navigate = useNavigate()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback className="rounded-lg">SC</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">shadcn</span>
                  <span className="truncate text-xs">m@example.com</span>
                </div>
              )}
              {!isCollapsed && <ChevronsUpDown className="ml-auto size-4" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile || isCollapsed ? "right" : "bottom"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback className="rounded-lg">SC</AvatarFallback>
                </Avatar>
                <div className="grid flex-1">
                  <span className="font-semibold">shadcn</span>
                  <span className="text-xs text-muted-foreground">m@example.com</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles className="size-4 mr-2" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="size-4 mr-2" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="size-4 mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="size-4 mr-2" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/" })}>
              <LogOut className="size-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const NavigationLink = ({ link, isCollapsed }) => {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <Link
          key={link.to}
          to={link.to}
          className={cn(
            "flex items-center rounded-lg text-muted-foreground transition-all hover:text-foreground",
            "data-[active]:bg-gradient-to-r data-[active]:from-blue-500/10 data-[active]:to-purple-500/10 data-[active]:text-blue-600 dark:data-[active]:text-blue-400",
            isCollapsed 
              ? "h-10 w-10 justify-center mx-auto" 
              : "w-full gap-3 px-3 py-2"
          )}
          activeProps={{
            "data-active": true
          }}
        >
          {React.cloneElement(link.icon, {
            className: cn(
              "transition-all",
              isCollapsed ? "h-5 w-5" : "h-4 w-4"
            )
          })}
          {!isCollapsed && (
            <span className="flex-1 whitespace-nowrap">{link.label}</span>
          )}
        </Link>
      </HoverCardTrigger>
      {isCollapsed && (
        <HoverCardContent side="right" className="w-40 p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{link.label}</p>
            <p className="text-xs text-muted-foreground">
              Navigate to {link.label.toLowerCase()}
            </p>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  )
}

export const DashNav = () => {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <OrganizationSwitcher />
        <Separator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <nav className="flex flex-col items-center gap-1">
            {navigationLinks.map((link) => (
              <NavigationLink 
                key={link.to} 
                link={link} 
                isCollapsed={isCollapsed} 
              />
            ))}
          </nav>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className={cn(
          "flex flex-col items-center gap-4",
          isCollapsed ? "px-0" : "p-4"
        )}>
          <ModeToggle iconOnly={isCollapsed} />
          {!isCollapsed && (
            <>
              <Separator />
              <AnnouncementCard />
            </>
          )}
        </div>
        <UserSwitcher />
      </SidebarFooter>
    </Sidebar>
  )
}
