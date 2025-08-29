import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const categories = [
  { value: "pizza", label: "Pizzaria" },
  { value: "hamburger", label: "Hamburgueria" },
  { value: "japanese", label: "Japonesa" },
  { value: "italian", label: "Italiana" },
  { value: "mexican", label: "Mexicana" },
  { value: "dessert", label: "Sobremesas" },
  { value: "healthy", label: "Saudável" },
  { value: "drinks", label: "Bebidas" },
  { value: "brazilian", label: "Brasileira" },
  { value: "other", label: "Outros" },
];

export default function SetupRestaurant() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    email: "",
    deliveryFee: "0.00",
    minDeliveryTime: 20,
    maxDeliveryTime: 40,
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/restaurants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-restaurant"] });
      toast({
        title: "Restaurante Criado!",
        description: "Seu restaurante foi configurado com sucesso. Bem-vindo ao RestaurantePro!",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao criar restaurante",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.address) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, categoria e endereço",
        variant: "destructive",
      });
      return;
    }
    createRestaurantMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">RestaurantePro</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.firstName || user?.email}
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
            <CardTitle data-testid="setup-title">🚀 Configure seu Restaurante</CardTitle>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <strong>✨ Período de Teste Gratuito Ativo!</strong>
                {user?.trialEndsAt && (
                  <span className="block mt-1">
                    Aproveite todas as funcionalidades até: <strong>{new Date(user.trialEndsAt).toLocaleDateString('pt-BR')}</strong>
                  </span>
                )}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Restaurante *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Pizzaria do João"
                    required
                    data-testid="input-restaurant-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descreva seu restaurante, especialidades, etc."
                  rows={3}
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Rua, número, bairro, cidade, CEP"
                  rows={2}
                  required
                  data-testid="input-address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email do Restaurante</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="contato@meurestaurante.com"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.deliveryFee}
                    onChange={(e) => handleInputChange("deliveryFee", e.target.value)}
                    data-testid="input-delivery-fee"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minTime">Tempo Mín. (min)</Label>
                  <Input
                    id="minTime"
                    type="number"
                    min="5"
                    max="120"
                    value={formData.minDeliveryTime}
                    onChange={(e) => handleInputChange("minDeliveryTime", parseInt(e.target.value))}
                    data-testid="input-min-time"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTime">Tempo Máx. (min)</Label>
                  <Input
                    id="maxTime"
                    type="number"
                    min="10"
                    max="180"
                    value={formData.maxDeliveryTime}
                    onChange={(e) => handleInputChange("maxDeliveryTime", parseInt(e.target.value))}
                    data-testid="input-max-time"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex-1"
                  data-testid="button-back"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={createRestaurantMutation.isPending}
                  className="flex-1"
                  data-testid="button-create-restaurant"
                >
                  {createRestaurantMutation.isPending ? "Criando..." : "Criar Restaurante"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}