import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LogIn } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirecionar usuários já autenticados
  useEffect(() => {
    if (isAuthenticated && user) {
      if ((user as any)?.role === "restaurant_owner") {
        setLocation("/dashboard");
      } else {
        setLocation("/customer-panel");
      }
    }
  }, [isAuthenticated, user, setLocation]);

  const handleLogin = () => {
    // Redirecionar para a rota de autenticação Replit
    window.location.href = "/api/login";
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
              Acesse sua conta no RestaurantePro
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Faça login com sua conta Replit para acessar o RestaurantePro
                </p>
              </div>

              <Button
                onClick={handleLogin}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-login"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar com Replit
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