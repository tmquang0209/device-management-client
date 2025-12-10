"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  bottomItems,
  MenuItem,
  menuItems,
} from "@/shared/constants/admin/slider-bar";
import { useSidebar } from "@/shared/context/sidebar.context";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface MenuItemProps extends MenuItem {
  isCollapsed: boolean;
  pathname: string;
  expandedItems: Set<string>;
  toggleExpanded: (id: string) => void;
}

function MenuItemComponent({
  id,
  icon: Icon,
  label,
  href,
  children,
  isCollapsed,
  pathname,
  expandedItems,
  toggleExpanded,
}: MenuItemProps) {
  const isExpanded = expandedItems.has(id);
  const isActive = href === pathname;
  const hasChildren = children && children.length > 0;

  if (hasChildren) {
    return (
      <div key={id}>
        <Button
          variant={isActive ? "default" : "ghost"}
          className={cn(
            "text-sidebar-foreground w-full justify-start gap-3",
            isActive && "bg-blue-600 text-white hover:bg-blue-700",
            !isActive && "hover:bg-sidebar-accent",
            isCollapsed && "px-2",
          )}
          onClick={() => toggleExpanded(id)}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="flex-1 text-left">{label}</span>}
          {!isCollapsed && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180",
              )}
            />
          )}
        </Button>
        {isExpanded && !isCollapsed && (
          <div className="border-sidebar-accent mt-1 ml-4 space-y-1 border-l pl-2">
            {children.map((child) => (
              <Link key={child.id} href={child.href || "#"}>
                <Button
                  variant={child.href === pathname ? "default" : "ghost"}
                  className={cn(
                    "text-sidebar-foreground w-full justify-start gap-3 text-sm",
                    child.href === pathname &&
                      "bg-blue-600 text-white hover:bg-blue-700",
                    child.href !== pathname && "hover:bg-sidebar-accent",
                  )}
                >
                  <child.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{child.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link key={id} href={href || "#"}>
      <Button
        variant={isActive ? "default" : "ghost"}
        className={cn(
          "text-sidebar-foreground w-full justify-start gap-3",
          isActive && "bg-blue-600 text-white hover:bg-blue-700",
          !isActive && "hover:bg-sidebar-accent",
          isCollapsed && "px-2",
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span>{label}</span>}
      </Button>
    </Link>
  );
}

export default function AdminSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Auto-expand parent menu if any child is active
    const initialExpanded = new Set<string>();
    for (const item of menuItems) {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.href === pathname,
        );
        if (hasActiveChild) {
          initialExpanded.add(item.id);
        }
      }
    }
    return initialExpanded;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div
      className={cn(
        "bg-sidebar border-sidebar-border flex h-screen flex-col border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="border-sidebar-border flex items-center justify-between border-b p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600"
              suppressHydrationWarning
            >
              <span className="text-sm font-bold text-white">HQ</span>
            </div>
            <span className="text-sidebar-foreground font-semibold">
              Quản lý thiết bị
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        <nav className="space-y-1 p-2">
          {menuItems.map((item) => (
            <MenuItemComponent
              key={item.id}
              {...item}
              isCollapsed={isCollapsed}
              pathname={pathname}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </nav>
      </div>

      {/* Bottom Menu */}
      <div className="border-sidebar-border border-t p-2">
        <nav className="space-y-1">
          {bottomItems.map((item) => (
            <MenuItemComponent
              key={item.id}
              {...item}
              isCollapsed={isCollapsed}
              pathname={pathname}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
