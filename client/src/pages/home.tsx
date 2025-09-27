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

  // Redirect new users to onboarding if they don't have a role set
  useEffect(() => {
    if (isAuthenticated && user && !user?.role) {
      setLocation("/onboarding");
      return;
    }
  }, [isAuthenticated, user, setLocation]);

  // Redirect restaurant owner to dashboard if restaurant exists
  useEffect(() => {
    if (isAuthenticated && user?.role === "restaurant_owner" && restaurant && !restaurantLoading) {
      setLocation("/dashboard");
      return;
    }
  }, [isAuthenticated, user, restaurant, restaurantLoading, setLocation]);

  // Check if user came from plan selection and redirect to restaurant setup
  useEffect(() => {
    if (isAuthenticated && user?.role === "restaurant_owner" && !restaurant && !restaurantLoading) {
      const selectedPlan = localStorage.getItem('selectedPlan');
      if (selectedPlan) {
        // User selected a plan, redirect to restaurant setup
        setLocation("/setup-restaurant");
        return;
      }
    }
  }, [isAuthenticated, user, restaurant, restaurantLoading, setLocation]);

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
              <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">GoFood</h1>
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
              <CardTitle data-testid="welcome-title">Bem-vindo ao GoFood!</CardTitle>
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
      // Check if user has active trial
      const isTrialUser = user?.subscriptionPlan === "trial" && user?.isTrialActive;
      
      if (isTrialUser) {
        // Show restaurant creation form during trial
        return (
          <div className="min-h-screen bg-background">
            <header className="bg-card shadow-sm border-b border-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">GoFood</h1>
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
                  <CardTitle data-testid="setup-title">✨ Bem-vindo ao seu teste gratuito!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">
                      <strong>🎉 Parabéns!</strong> Você tem 7 dias gratuitos para testar todas as funcionalidades do GoFood.
                      {user?.trialEndsAt && (
                        <span className="block mt-1">
                          Seu teste expira em: <strong>{new Date(user.trialEndsAt).toLocaleDateString('pt-BR')}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-muted-foreground" data-testid="setup-description">
                    Vamos configurar seu restaurante! Você pode criar seu restaurante agora e explorar todas as funcionalidades durante o período de teste.
                  </p>
                  <Button 
                    onClick={() => setLocation("/setup-restaurant")}
                    className="w-full"
                    data-testid="button-setup-restaurant"
                  >
                    Criar Meu Restaurante
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation("/sales")}
                    className="w-full"
                    data-testid="button-view-plans"
                  >
                    Ver Planos e Preços
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      } else {
        // Trial expired or not active, show payment options
        return (
          <div className="min-h-screen bg-background">
            <header className="bg-card shadow-sm border-b border-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">GoFood</h1>
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
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">
                      Seu período de teste gratuito expirou. Escolha um plano para continuar usando o GoFood.
                    </p>
                  </div>
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
    }

    // This shouldn't be reached as useEffect handles dashboard redirect
    return null;
  }

  // Default: redirect to landing
  setLocation("/");
  return null;
}
