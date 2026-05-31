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
          {/* Logo plate */}
          <div
            className="neu-button-icon"
            style={{
              width: "auto", height: 36, borderRadius: 10, flexShrink: 0,
              padding: collapsed ? "0 9px" : "0 12px 0 9px", gap: 10,
            }}
          >
            <PaintBucketIcon style={{ width: 18, height: 18, color: "var(--k-cloud-deep)" }} />
            {!collapsed && (
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--k-text-primary)", letterSpacing: "-0.3px" }}>
                7{" "}
                <span style={{ fontWeight: 700 }}>
                  <span style={{ color: "#ef4444" }}>C</span>
                  <span style={{ color: "#f97316" }}>O</span>
                  <span style={{ color: "#eab308" }}>L</span>
                  <span style={{ color: "#22c55e" }}>O</span>
                  <span style={{ color: "#3b82f6" }}>R</span>
                  <span style={{ color: "#a855f7" }}>S</span>
                </span>
              </span>
            )}
          </div>
          {/* Expanded: controls sit next to logo */}
          <div className="ml-auto flex shrink-0 items-center gap-1 group-data-[collapsible=icon]:hidden">
            <SidebarTrigger />
            <ThemeToggle />
          </div>
        </div>
        {/* Collapsed: controls appear below icon; expanded: invisible spacer keeps header height consistent */}
        <div className="flex flex-col gap-0.5 opacity-0 pointer-events-none group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:pointer-events-auto">
          <SidebarTrigger />
          <ThemeToggle />
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
