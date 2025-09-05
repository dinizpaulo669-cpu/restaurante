import { useState, useEffect } from "react";
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
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    phone: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Check for selected plan from localStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem('selectedPlan');
    if (savedPlan && savedPlan !== 'undefined' && savedPlan !== 'null') {
      try {
        const parsedPlan = JSON.parse(savedPlan);
        if (parsedPlan && typeof parsedPlan === 'object' && parsedPlan.name) {
          setSelectedPlan(parsedPlan);
        } else {
          localStorage.removeItem('selectedPlan');
        }
      } catch (error) {
        console.error('Error parsing selected plan:', error);
        localStorage.removeItem('selectedPlan');
      }
    } else {
      localStorage.removeItem('selectedPlan');
    }
  }, []);

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/restaurants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-restaurant"] });
      // Clear selected plan from localStorage
      localStorage.removeItem('selectedPlan');
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
    
    if (!formData.name || !formData.category || !formData.cep || !formData.rua || !formData.numero) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, categoria, CEP, rua e número",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.senha || formData.senha.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação de senha deve ser igual à senha",
        variant: "destructive",
      });
      return;
    }
    
    // Concatenar endereço completo
    const endereco = `${formData.rua}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}, CEP: ${formData.cep}`;
    
    const dataToSubmit = {
      ...formData,
      address: endereco
    };
    
    createRestaurantMutation.mutate(dataToSubmit);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepChange = async (cep: string) => {
    setFormData(prev => ({ ...prev, cep }));
    
    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }));
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique se o CEP está correto",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao buscar CEP",
          description: "Não foi possível consultar o endereço",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCep(false);
      }
    }
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
                {(user as any)?.firstName || (user as any)?.email}
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
            {selectedPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm">
                  <strong>📋 Plano Selecionado: {selectedPlan.name}</strong>
                  <span className="block mt-1">
                    R$ {selectedPlan.price}/mês - Após criar seu restaurante, você terá 7 dias grátis para testar!
                  </span>
                </p>
              </div>
            )}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <strong>✨ Período de Teste Gratuito Ativo!</strong>
                {(user as any)?.trialEndsAt && (
                  <span className="block mt-1">
                    Aproveite todas as funcionalidades até: <strong>{new Date((user as any).trialEndsAt).toLocaleDateString('pt-BR')}</strong>
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

              {/* Seção de Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        data-testid="input-cep"
                      />
                      {isLoadingCep && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="rua">Rua *</Label>
                    <Input
                      id="rua"
                      value={formData.rua}
                      onChange={(e) => handleInputChange("rua", e.target.value)}
                      placeholder="Nome da rua"
                      required
                      data-testid="input-rua"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => handleInputChange("numero", e.target.value)}
                      placeholder="123"
                      required
                      data-testid="input-numero"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => handleInputChange("bairro", e.target.value)}
                      placeholder="Bairro"
                      data-testid="input-bairro"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange("cidade", e.target.value)}
                      placeholder="Cidade"
                      data-testid="input-cidade"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleInputChange("estado", e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      data-testid="input-estado"
                    />
                  </div>
                </div>
              </div>

              {/* Seção de Contato */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações de Contato</h3>
                
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
              </div>
              
              {/* Seção de Segurança */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados de Acesso</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => handleInputChange("senha", e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                      data-testid="input-senha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                      placeholder="Repita a senha"
                      required
                      data-testid="input-confirmar-senha"
                    />
                  </div>
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