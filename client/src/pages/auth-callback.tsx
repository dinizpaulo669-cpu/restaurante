import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest("POST", "/api/update-role", { role });
    },
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/auth/user"] });
      
      // Limpar a seleção temporária
      localStorage.removeItem('selectedUserType');
      
      // Redirecionar baseado no role
      if (role === "restaurant_owner") {
        setLocation("/dashboard");
      } else {
        setLocation("/customer-panel");
      }
    },
    onError: () => {
      // Em caso de erro, redirecionar para onboarding
      setLocation("/onboarding");
    },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Verificar se o usuário já tem um role definido
      if ((user as any)?.role) {
        if ((user as any).role === "restaurant_owner") {
          setLocation("/dashboard");
        } else {
          setLocation("/customer-panel");
        }
        return;
      }

      // Verificar se há uma seleção de tipo salva no localStorage
      const selectedUserType = localStorage.getItem('selectedUserType');
      
      if (selectedUserType && (selectedUserType === "customer" || selectedUserType === "restaurant_owner")) {
        // Definir o role do usuário baseado na seleção
        updateRoleMutation.mutate(selectedUserType);
      } else {
        // Se não há seleção, redirecionar para onboarding
        setLocation("/onboarding");
      }
    } else if (!isLoading && !isAuthenticated) {
      // Se não está autenticado, redirecionar para login
      setLocation("/login");
    }
  }, [isAuthenticated, user, isLoading, setLocation]);

  // Mostrar loading enquanto processa
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Processando login...</p>
      </div>
    </div>
  );
}