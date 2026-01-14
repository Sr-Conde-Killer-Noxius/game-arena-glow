import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // On desktop, keep sidebar state
      } else {
        // On mobile, close sidebar
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3 safe-area-inset-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="text-foreground touch-manipulation"
        >
          <Menu size={24} />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="font-display font-bold text-primary-foreground text-sm">
              J
            </span>
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            JPG
          </span>
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          // Mobile: add padding for fixed header
          "pt-16 lg:pt-0",
          // Desktop: adjust for sidebar width
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
