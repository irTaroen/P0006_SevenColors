import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/navbar/app-sidebar"
import { SiteHeader } from "@/components/navbar/site-header"
import { AppProviders } from "@/app/providers"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProviders>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-h-0 overflow-hidden">
            <SiteHeader />
            <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AppProviders>
  )
}
