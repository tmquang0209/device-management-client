"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/shared/context/theme.context";
import { Moon, Sun } from "lucide-react";

export default function AdminHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-background border-border border-b px-6 py-4">
      <div className="flex items-center justify-end">
        {/* Search */}
        {/* <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search..." className="pl-10 bg-muted/50" />
          </div>
        </div> */}

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          {/* <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
          </Button> */}

          {/* Language */}
          {/* <div className="flex items-center gap-2 text-sm">
            <img src="/uk-flag.png" alt="English" className="w-5 h-4" />
            <span className="text-foreground">English</span>
          </div> */}

          {/* User Profile */}
          {/* <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/diverse-user-avatars.png" />
              <AvatarFallback>MR</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium text-foreground">Moni Roy</p>
              <p className="text-muted-foreground">Admin</p>
            </div>
          </div> */}
        </div>
      </div>
    </header>
  );
}
