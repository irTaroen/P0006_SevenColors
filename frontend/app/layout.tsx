import { Geist_Mono, Poppins } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/navbar/app-sidebar"
import { SiteHeader } from "@/components/navbar/site-header"
import { AppProviders } from "@/app/providers"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", poppins.variable)}
    >
      <body>
        {/* Starfield — fixed behind all content, shown in dark mode via CSS */}
        <div className="starfield" aria-hidden="true" />
        <ThemeProvider>
          <AppProviders>
            <TooltipProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <SiteHeader />
                  <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
