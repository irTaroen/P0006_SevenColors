"use client";

import {
  PackageIcon,
  ShoppingCartIcon,
  BoxIcon,
  BuildingIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  LayoutDashboardIcon,
  ArchiveIcon,
} from "lucide-react";

export const navbarConfig = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Orders",
      url: "/orders",
      icon: <ShoppingCartIcon />,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: <ArchiveIcon />,
    },
    {
      title: "Clients",
      url: "/clients",
      icon: <BuildingIcon />,
    },
    {
      title: "Items",
      url: "/items",
      icon: <BoxIcon />,
    },
    {
      title: "Products",
      url: "/products",
      icon: <PackageIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: <DatabaseIcon />,
    },
    {
      name: "Reports",
      url: "#",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: <FileIcon />,
    },
  ],
};
