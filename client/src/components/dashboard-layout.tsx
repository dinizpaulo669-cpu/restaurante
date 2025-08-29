import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@shared/schema";
import { BarChart3, Utensils, Receipt, Settings, Bell } from "lucide-react";

interface DashboardLayoutProps {
  restaurant: Restaurant;
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}

const navigationItems = [
  { id: "overview", label: "Dashboard", icon: BarChart3 },
  { id: "products", label: "Produtos", icon: Utensils },
  { id: "orders", label: "Comandas", icon: Receipt },
  { id: "config", label: "Configurações", icon: Settings },
];

export function DashboardLayout({ 
  restaurant, 
  activeSection, 
  onSectionChange, 
  children 
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <h1 className="text-xl font-bold text-sidebar-primary" data-testid="dashboard-logo">RestaurantePro</h1>
        </div>
        <nav className="mt-6">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={cn(
                "w-full flex items-center px-6 py-3 text-left transition-colors",
                activeSection === id
                  ? "text-sidebar-primary border-r-2 border-sidebar-primary bg-sidebar-primary/10"
                  : "text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
              )}
              data-testid={`nav-${id}`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-sidebar border-b border-sidebar-border h-16 flex items-center justify-between px-6">
          <h2 className="text-2xl font-semibold" data-testid="section-title">
            {navigationItems.find(item => item.id === activeSection)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sidebar-primary-foreground text-sm font-semibold">
                  {restaurant.name.charAt(0)}
                </span>
              </div>
              <span className="font-medium" data-testid="restaurant-name">{restaurant.name}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              Sair
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
