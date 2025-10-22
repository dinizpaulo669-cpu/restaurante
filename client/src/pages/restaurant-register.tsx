import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, UtensilsCrossed, FileText, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function RestaurantRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ownerName: "",
    email: "",
    phone: "",
    restaurantName: "",
    description: "",
    address: "",
    cuisine: "",
    operatingHours: ""
  });

  useEffect(() => {
    // Verificar se veio da seleção de planos
    const plan = localStorage.getItem('selectedPlan');
    if (plan) {
      setSelectedPlan(plan);
    } else {
      // Se não veio da seleção de planos, redirecionar para sales
      setLocation("/sales");
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ownerName || !formData.email || !formData.phone || !formData.restaurantName || !formData.address) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Enviar dados para o backend (novo endpoint de registro)
      const response = await apiRequest("POST", "/api/register-restaurant", {
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        name: formData.restaurantName,
        description: formData.description,
        address: formData.address,
        category: formData.cuisine || "Diversos",
      });

      const data = await response.json();

      // Salvar dados do usuário no localStorage para manter a sessão
      localStorage.setItem('currentUser', JSON.stringify({
        id: data.userId,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        restaurantId: data.restaurant.id,
        restaurantName: formData.restaurantName,
        plan: selectedPlan,
        type: 'restaurant',
        createdAt: new Date().toISOString()
      }));

      // Limpar plano selecionado
      localStorage.removeItem('selectedPlan');

      toast({
        title: "Restaurante cadastrado!",
        description: `Bem-vindo ao RestaurantePro, ${formData.restaurantName}!`,
      });

      // Redirecionar para o painel do restaurante
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Erro ao cadastrar restaurante:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao criar seu restaurante. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary" data-testid="restaurant-register-title">
              Cadastrar Restaurante
            </CardTitle>
            <p className="text-muted-foreground" data-testid="restaurant-register-subtitle">
              Complete seu cadastro para começar a vender
            </p>
            {selectedPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>📋 Plano selecionado: {selectedPlan}</strong>
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados do Responsável</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-sm font-medium">
                      Nome completo *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ownerName"
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.ownerName}
                        onChange={(e) => handleInputChange("ownerName", e.target.value)}
                        className="pl-10"
                        data-testid="input-owner-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="pl-10"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pl-10"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados do Restaurante</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="text-sm font-medium">
                    Nome do restaurante *
                  </Label>
                  <div className="relative">
                    <UtensilsCrossed className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="restaurantName"
                      type="text"
                      placeholder="Nome do seu restaurante"
                      value={formData.restaurantName}
                      onChange={(e) => handleInputChange("restaurantName", e.target.value)}
                      className="pl-10"
                      data-testid="input-restaurant-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descrição
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="description"
                      placeholder="Conte um pouco sobre seu restaurante..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="pl-10 min-h-[80px]"
                      data-testid="input-description"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Endereço *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Endereço completo do restaurante"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="pl-10"
                      data-testid="input-address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuisine" className="text-sm font-medium">
                      Tipo de cozinha
                    </Label>
                    <Input
                      id="cuisine"
                      type="text"
                      placeholder="Ex: Italiana, Japonesa, Brasileira"
                      value={formData.cuisine}
                      onChange={(e) => handleInputChange("cuisine", e.target.value)}
                      data-testid="input-cuisine"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operatingHours" className="text-sm font-medium">
                      Horário de funcionamento
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="operatingHours"
                        type="text"
                        placeholder="Ex: 18h às 23h"
                        value={formData.operatingHours}
                        onChange={(e) => handleInputChange("operatingHours", e.target.value)}
                        className="pl-10"
                        data-testid="input-hours"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-register-restaurant"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar Restaurante"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setLocation("/sales")}
                  data-testid="button-back-sales"
                >
                  ← Voltar para planos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}