import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
