import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UtensilsCrossed } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Onboarding() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Check if user came from plan selection - automatically set as restaurant owner
  useEffect(() => {
    const selectedPlan = localStorage.getItem('selectedPlan');
    if (selectedPlan) {
      setSelectedRole("restaurant_owner");
    }
  }, []);

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest("POST", "/api/update-role", { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (selectedRole === "customer") {
        setLocation("/");
      } else {
        // Check if user came from plan selection
        const selectedPlan = localStorage.getItem('selectedPlan');
        if (selectedPlan) {
          setLocation("/setup-restaurant");
        } else {
          setLocation("/");
        }
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao definir tipo de usuário",
        variant: "destructive",
      });
    },
  });

  const handleRoleSelection = () => {
    if (!selectedRole) {
      toast({
        title: "Selecione uma opção",
        description: "Escolha como deseja usar o GoFood",
        variant: "destructive",
      });
      return;
    }
    updateRoleMutation.mutate(selectedRole);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold" data-testid="onboarding-title">
              Bem-vindo ao GoFood!
            </CardTitle>
            <p className="text-muted-foreground mt-2" data-testid="onboarding-subtitle">
              Olá, {user?.firstName || user?.email}! Como você gostaria de usar nossa plataforma?
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedRole === "restaurant_owner" && localStorage.getItem('selectedPlan') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm">
                  <strong>📋 Você selecionou um plano!</strong>
                  <span className="block mt-1">
                    Vamos configurar seu restaurante para que você possa aproveitar todos os recursos.
                  </span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div
                onClick={() => setSelectedRole("customer")}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                  selectedRole === "customer"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                data-testid="role-customer"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Sou Cliente</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Quero fazer pedidos e descobrir restaurantes
                    </p>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Navegar por restaurantes</li>
                    <li>• Fazer pedidos online</li>
                    <li>• Acompanhar entregas</li>
                  </ul>
                </div>
              </div>

              {/* Restaurante */}
              <div
                onClick={() => setSelectedRole("restaurant_owner")}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                  selectedRole === "restaurant_owner"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                data-testid="role-restaurant"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <UtensilsCrossed className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Tenho um Restaurante</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Quero cadastrar e gerenciar meu estabelecimento
                    </p>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Painel de controle completo</li>
                    <li>• Gerenciar cardápio</li>
                    <li>• Receber pedidos online</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/api/logout"}
                className="flex-1"
                data-testid="button-logout"
              >
                Voltar
              </Button>
              <Button
                onClick={handleRoleSelection}
                disabled={!selectedRole || updateRoleMutation.isPending}
                className="flex-1"
                data-testid="button-continue"
              >
                {updateRoleMutation.isPending ? "Configurando..." : "Continuar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}