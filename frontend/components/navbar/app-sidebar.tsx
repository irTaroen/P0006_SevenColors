"use client";

import * as React from "react";
import { PaintBucketIcon } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { NavActions } from "@/components/navbar/nav-actions";
import { NavLinks } from "@/components/navbar/nav-links";
import { NavUser } from "@/components/navbar/nav-user";
import { navbarConfig } from "@/components/navbar/navbar_config";
import { currentUser } from "@/components/navbar/current-user";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!" render={<a href="#" />}>
                {collapsed ? (
                  <svg
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    stroke="url(#paint-bucket-grad)"
                    className="size-5! shrink-0"
                  >
                    <defs>
                      <linearGradient id="paint-bucket-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%"   stopColor="#ef4444" />
                        <stop offset="20%"  stopColor="#f97316" />
                        <stop offset="40%"  stopColor="#eab308" />
                        <stop offset="60%"  stopColor="#22c55e" />
                        <stop offset="80%"  stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <path d="M11 7 6 2" />
                    <path d="M18.992 12H2.041" />
                    <path d="M21.145 18.38A3.34 3.34 0 0 1 20 16.5a3.3 3.3 0 0 1-1.145 1.88c-.575.46-.855 1.02-.855 1.595A2 2 0 0 0 20 22a2 2 0 0 0 2-2.025c0-.58-.285-1.13-.855-1.595" />
                    <path d="m8.5 4.5 2.148-2.148a1.205 1.205 0 0 1 1.704 0l7.296 7.296a1.205 1.205 0 0 1 0 1.704l-7.592 7.592a3.615 3.615 0 0 1-5.112 0l-3.888-3.888a3.615 3.615 0 0 1 0-5.112L5.67 7.33" />
                  </svg>
                ) : (
                  <PaintBucketIcon className="size-5!" />
                )}
                <span className="text-base font-semibold">
                  7{" "}
                  <span className="font-bold">
                    <span className="text-red-500">C</span>
                    <span className="text-orange-500">O</span>
                    <span className="text-yellow-500">L</span>
                    <span className="text-green-500">O</span>
                    <span className="text-blue-500">R</span>
                    <span className="text-purple-500">S</span>
                  </span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {/* Expanded: controls sit next to logo */}
          <div className="ml-auto flex shrink-0 items-center gap-1 group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
            <SidebarTrigger />
          </div>
        </div>
        {/* Collapsed: controls appear below icon; expanded: invisible spacer keeps header height consistent */}
        <div className="flex flex-col gap-0.5 opacity-0 pointer-events-none group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:pointer-events-auto">
          <ThemeToggle />
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavActions /> */}
        <NavLinks items={navbarConfig.navMain} />
        <NavLinks items={navbarConfig.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
