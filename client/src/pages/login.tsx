import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, User, Store } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedUserType, setSelectedUserType] = useState<"customer" | "restaurant_owner" | "">("");

  // Removido redirecionamento automático - sempre mostra a página de login

  const handleLogin = () => {
    if (!selectedUserType) {
      return;
    }
    
    // Salvar tipo selecionado e redirecionar para página de login interno
    localStorage.setItem('selectedUserType', selectedUserType);
    setLocation("/internal-login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary" data-testid="login-title">
              Entrar
            </CardTitle>
            <p className="text-muted-foreground" data-testid="login-subtitle">
              Como você vai usar o GoFood?
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">

              {/* Seleção de tipo de usuário */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">Selecione uma opção:</p>
                
                <div className="grid grid-cols-1 gap-3">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedUserType === "customer" 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedUserType("customer")}
                    data-testid="card-customer-type"
                  >
                    <CardContent className="p-4 flex items-center space-x-3">
                      <User className="h-6 w-6 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-medium">Sou Cliente</h3>
                        <p className="text-sm text-muted-foreground">
                          Quero pedir comida dos restaurantes
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedUserType === "restaurant_owner" 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedUserType("restaurant_owner")}
                    data-testid="card-restaurant-type"
                  >
                    <CardContent className="p-4 flex items-center space-x-3">
                      <Store className="h-6 w-6 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-medium">Sou Dono de Restaurante</h3>
                        <p className="text-sm text-muted-foreground">
                          Quero gerenciar meu restaurante
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={!selectedUserType}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                data-testid="button-login"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </Button>

              <div className="text-center space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setLocation("/")}
                  data-testid="button-back-home"
                >
                  ← Voltar para início
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}