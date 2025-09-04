import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, ArrowLeft, User, Store } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function InternalLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Recuperar o tipo de usuário selecionado
  const selectedUserType = localStorage.getItem('selectedUserType') || "";
  const userTypeLabel = selectedUserType === "restaurant_owner" ? "Dono de Restaurante" : "Cliente";
  const UserIcon = selectedUserType === "restaurant_owner" ? Store : User;

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string; userType: string }) => {
      return await apiRequest("POST", "/api/internal-login", credentials);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/auth/user"] });
      
      // Limpar o tipo selecionado
      localStorage.removeItem('selectedUserType');
      
      // Redirecionar baseado no tipo
      if (selectedUserType === "restaurant_owner") {
        setLocation("/dashboard");
      } else {
        setLocation("/customer-panel");
      }
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a) ao RestaurantePro!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({
      email,
      password,
      userType: selectedUserType
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary" data-testid="login-title">
              Login como {userTypeLabel}
            </CardTitle>
            <p className="text-muted-foreground" data-testid="login-subtitle">
              Digite suas credenciais para acessar o sistema
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loginMutation.isPending}
                data-testid="button-submit-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Entrando...
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/login")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  data-testid="button-back-selection"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para seleção de tipo
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                <p>Não tem uma conta? Entre em contato com o administrador.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}