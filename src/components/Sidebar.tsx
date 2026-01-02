import { Link, useLocation } from "react-router-dom";
import {
  Gamepad2,
  Trophy,
  User,
  BarChart3,
  Users,
  Menu,
  ChevronLeft,
  Ticket,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: Gamepad2, label: "Jogos", path: "/dashboard", active: true },
  { icon: Ticket, label: "Meus Ingressos", path: "/my-tickets", active: true },
  { icon: User, label: "Perfil", path: "/profile", active: true },
  { icon: Shield, label: "Admin", path: "/admin", active: true, adminOnly: true },
  { icon: Trophy, label: "Torneios-Ranked", path: "/tournaments", active: false },
  { icon: BarChart3, label: "Ranking", path: "/ranking", active: false },
  { icon: Users, label: "JPG Social", path: "/social", active: false },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  // Filter menu items based on admin status
  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          isOpen ? "w-64" : "w-0 lg:w-20",
          !isOpen && "overflow-hidden lg:overflow-visible"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
          {isOpen && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center neon-glow">
                <span className="font-display font-bold text-primary-foreground text-lg">
                  J
                </span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                JPG
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:text-foreground"
          >
            {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-2">
            {visibleMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  {item.active ? (
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      <Icon
                        size={22}
                        className={cn(
                          "transition-all",
                          isActive && "text-neon-glow"
                        )}
                      />
                      {isOpen && (
                        <span className="font-medium text-sm uppercase tracking-wide">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground/50 cursor-not-allowed"
                      )}
                    >
                      <Icon size={22} />
                      {isOpen && (
                        <>
                          <span className="font-medium text-sm uppercase tracking-wide">
                            {item.label}
                          </span>
                          <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">
                            Em breve
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 JPG Platform
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
