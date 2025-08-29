import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ["/api/my-restaurant"],
    enabled: isAuthenticated && user?.role === "restaurant_owner",
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Customer home page
  if (user?.role === "customer") {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">RestaurantePro</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground" data-testid="user-welcome">
                  Olá, {user.firstName || user.email}
                </span>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = "/api/logout"}
                  data-testid="button-logout"
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle data-testid="welcome-title">Bem-vindo ao RestaurantePro!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground" data-testid="customer-description">
                Você está logado como cliente. Explore restaurantes e faça pedidos através da nossa plataforma.
              </p>
              <Button 
                onClick={() => setLocation("/")}
                className="w-full"
                data-testid="button-explore-restaurants"
              >
                Explorar Restaurantes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Restaurant owner home page
  if (user?.role === "restaurant_owner") {
    if (restaurantLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!restaurant) {
      return (
        <div className="min-h-screen bg-background">
          <header className="bg-card shadow-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">RestaurantePro</h1>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = "/api/logout"}
                  data-testid="button-logout"
                >
                  Sair
                </Button>
              </div>
            </div>
          </header>

          <div className="max-w-4xl mx-auto px-4 py-12">
            <Card>
              <CardHeader>
                <CardTitle data-testid="setup-title">Configure seu Restaurante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground" data-testid="setup-description">
                  Para continuar, você precisa escolher um plano e configurar seu restaurante.
                </p>
                <Button 
                  onClick={() => setLocation("/sales")}
                  className="w-full"
                  data-testid="button-choose-plan"
                >
                  Escolher Plano
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Redirect to dashboard if restaurant exists
    setLocation("/dashboard");
    return null;
  }

  // Default: redirect to landing
  setLocation("/");
  return null;
}
