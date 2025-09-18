import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  UtensilsCrossed, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  LogOut, 
  Package, 
  ShoppingBag, 
  TrendingUp,
  Plus,
  Upload,
  Image
} from "lucide-react";

export default function RestaurantPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      setLocation("/");
      return;
    }
    
    const user = JSON.parse(currentUser);
    if (user.type !== 'restaurant') {
      setLocation("/");
      return;
    }
    
    setRestaurant(user);
  }, [setLocation]);

  // Mutações para upload de logo e banner
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/dev/restaurants/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Falha ao fazer upload do logo');
      }
      
      return response.json();
    },
    onSuccess: (updatedRestaurant) => {
      // Atualizar o estado local mesclando com dados existentes
      setRestaurant((prev: any) => ({ ...prev, ...updatedRestaurant }));
      // Mesclar com dados existentes do localStorage para preservar campos como 'type'
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...updatedRestaurant }));
      // Invalidar cache do React Query para atualizações
      queryClient.invalidateQueries({ queryKey: ['/api/dev/my-restaurant'] });
      toast({
        title: "Logo atualizado!",
        description: "O logo foi enviado e atualizado com sucesso.",
      });
      // Limpar o input de arquivo
      const logoInput = document.querySelector('input[data-testid="input-logo-file"]') as HTMLInputElement;
      if (logoInput) logoInput.value = '';
    },
    onError: () => {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do logo. Tente novamente.",
        variant: "destructive",
      });
      // Limpar o input de arquivo mesmo em caso de erro
      const logoInput = document.querySelector('input[data-testid="input-logo-file"]') as HTMLInputElement;
      if (logoInput) logoInput.value = '';
    },
  });

  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('banner', file);
      
      const response = await fetch('/api/dev/restaurants/banner', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Falha ao fazer upload do banner');
      }
      
      return response.json();
    },
    onSuccess: (updatedRestaurant) => {
      // Atualizar o estado local mesclando com dados existentes
      setRestaurant((prev: any) => ({ ...prev, ...updatedRestaurant }));
      // Mesclar com dados existentes do localStorage para preservar campos como 'type'
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...updatedRestaurant }));
      // Invalidar cache do React Query para atualizações
      queryClient.invalidateQueries({ queryKey: ['/api/dev/my-restaurant'] });
      toast({
        title: "Banner atualizado!",
        description: "O banner foi enviado e atualizado com sucesso.",
      });
      // Limpar o input de arquivo
      const bannerInput = document.querySelector('input[data-testid="input-banner-file"]') as HTMLInputElement;
      if (bannerInput) bannerInput.value = '';
    },
    onError: () => {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do banner. Tente novamente.",
        variant: "destructive",
      });
      // Limpar o input de arquivo mesmo em caso de erro
      const bannerInput = document.querySelector('input[data-testid="input-banner-file"]') as HTMLInputElement;
      if (bannerInput) bannerInput.value = '';
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione uma imagem válida.",
          variant: "destructive",
        });
        return;
      }
      
      uploadLogoMutation.mutate(file);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione uma imagem válida.",
          variant: "destructive",
        });
        return;
      }
      
      uploadBannerMutation.mutate(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    setLocation("/");
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">RestaurantePro</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" data-testid="restaurant-badge">
                  {restaurant.plan}
                </Badge>
                {/* Status do plano com dias restantes */}
                {(() => {
                  // Usar a mesma lógica do getTrialStatus do admin dashboard
                  if (!restaurant.isTrialActive) {
                    return (
                      <Badge variant="destructive" data-testid="trial-expired-badge">
                        Trial expirado
                      </Badge>
                    );
                  }
                  
                  if (!restaurant.trialEndsAt) {
                    return (
                      <Badge variant="default" data-testid="trial-active-badge">
                        Trial ativo
                      </Badge>
                    );
                  }
                  
                  const endDate = new Date(restaurant.trialEndsAt);
                  const now = new Date();
                  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  
                  if (daysLeft <= 0) {
                    return (
                      <Badge variant="destructive" data-testid="trial-expired-badge">
                        Trial expirado
                      </Badge>
                    );
                  }
                  
                  if (daysLeft <= 3) {
                    return (
                      <Badge variant="secondary" data-testid="trial-warning-badge">
                        {daysLeft} dias restantes
                      </Badge>
                    );
                  }
                  
                  return (
                    <Badge variant="default" data-testid="trial-status-badge">
                      {daysLeft} dias restantes
                    </Badge>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {restaurant.restaurantName?.charAt(0).toUpperCase() || 'R'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium" data-testid="restaurant-name">{restaurant.restaurantName}</p>
                  <p className="text-xs text-muted-foreground" data-testid="owner-email">{restaurant.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="welcome-title">
              Bem-vindo, {restaurant.restaurantName}! 🍽️
            </h1>
            <p className="text-lg mb-6 opacity-90" data-testid="welcome-subtitle">
              Gerencie seu restaurante e faça seus clientes felizes
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm opacity-90">Pedidos hoje</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">R$ 0,00</div>
                <div className="text-sm opacity-90">Vendas hoje</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm opacity-90">Produtos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">Dashboard</TabsTrigger>
              <TabsTrigger value="products" data-testid="tab-products">Produtos</TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">Pedidos</TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">+0% desde ontem</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">R$ 0,00</div>
                    <p className="text-xs text-muted-foreground">+0% desde ontem</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Cadastre seus produtos</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Aguardando pedidos</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Próximos Passos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Cadastre seus produtos</p>
                      <p className="text-sm text-blue-700">Adicione itens ao seu cardápio para começar a vender</p>
                    </div>
                    <Button size="sm" className="ml-auto">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Produtos</h2>
                <Button data-testid="button-add-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece adicionando seus primeiros produtos ao cardápio
                  </p>
                  <Button data-testid="button-add-first-product">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Produto
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6 mt-6">
              <h2 className="text-2xl font-bold">Comandas</h2>
              
              {/* Sub-abas por status de pedido com cores */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="all" className="bg-slate-100 text-slate-800 data-[state=active]:bg-slate-200" data-testid="tab-all-orders">
                    Todos
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="bg-yellow-100 text-yellow-800 data-[state=active]:bg-yellow-200" data-testid="tab-pending-orders">
                    Pendentes
                  </TabsTrigger>
                  <TabsTrigger value="preparing" className="bg-orange-100 text-orange-800 data-[state=active]:bg-orange-200" data-testid="tab-preparing-orders">
                    Preparando
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="bg-blue-100 text-blue-800 data-[state=active]:bg-blue-200" data-testid="tab-ready-orders">
                    Prontos
                  </TabsTrigger>
                  <TabsTrigger value="out_for_delivery" className="bg-purple-100 text-purple-800 data-[state=active]:bg-purple-200" data-testid="tab-delivery-orders">
                    A caminho
                  </TabsTrigger>
                  <TabsTrigger value="delivered" className="bg-green-100 text-green-800 data-[state=active]:bg-green-200" data-testid="tab-delivered-orders">
                    Entregues
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="bg-red-100 text-red-800 data-[state=active]:bg-red-200" data-testid="tab-cancelled-orders">
                    Cancelados
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum pedido ainda</h3>
                      <p className="text-muted-foreground">
                        Os pedidos dos clientes aparecerão aqui
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhum pedido pendente</h3>
                      <p className="text-muted-foreground">
                        Pedidos aguardando confirmação aparecerão aqui
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preparing" className="mt-6">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhum pedido em preparo</h3>
                      <p className="text-muted-foreground">
                        Pedidos sendo preparados aparecerão aqui
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ready" className="mt-6">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhum pedido pronto</h3>
                      <p className="text-muted-foreground">
                        Pedidos prontos para entrega/retirada aparecerão aqui
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="out_for_delivery" className="mt-6">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhum pedido a caminho</h3>
                      <p className="text-muted-foreground">
                        Pedidos em processo de entrega aparecerão aqui
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="delivered" className="mt-6">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhum pedido entregue hoje</h3>
                      <p className="text-muted-foreground">
                        Pedidos entregues aparecerão aqui
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cancelled" className="mt-6">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhum pedido cancelado</h3>
                      <p className="text-muted-foreground">
                        Pedidos cancelados aparecerão aqui
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <h2 className="text-2xl font-bold">Configurações do Restaurante</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UtensilsCrossed className="h-5 w-5 mr-2" />
                    Informações do Restaurante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Responsável:</span>
                        <span className="text-sm" data-testid="owner-name">{restaurant.ownerName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Email:</span>
                        <span className="text-sm" data-testid="owner-email-settings">{restaurant.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Telefone:</span>
                        <span className="text-sm" data-testid="owner-phone">{restaurant.phone}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Endereço:</span>
                        <span className="text-sm" data-testid="restaurant-address">{restaurant.address}</span>
                      </div>
                      {restaurant.cuisine && (
                        <div className="flex items-center space-x-2">
                          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Cozinha:</span>
                          <span className="text-sm" data-testid="restaurant-cuisine">{restaurant.cuisine}</span>
                        </div>
                      )}
                      {restaurant.operatingHours && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Horário:</span>
                          <span className="text-sm" data-testid="restaurant-hours">{restaurant.operatingHours}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {restaurant.description && (
                    <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                      <p className="text-sm" data-testid="restaurant-description">{restaurant.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seção de Logo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Logo do Restaurante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Enviar Logo</h3>
                      <p className="text-muted-foreground mb-4">
                        Escolha uma imagem do seu dispositivo para usar como logo (máximo 5MB).
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Selecionar Arquivo de Imagem
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={uploadLogoMutation.isPending}
                            className="w-full p-3 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            data-testid="input-logo-file"
                          />
                        </div>
                        
                        {uploadLogoMutation.isPending && (
                          <div className="text-sm text-muted-foreground">
                            Fazendo upload do logo...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Pré-visualização</h3>
                      
                      <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                        {restaurant?.logoUrl ? (
                          <img 
                            src={`${restaurant.logoUrl}?t=${Date.now()}`}
                            alt="Logo do restaurante" 
                            className="max-w-full max-h-48 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhum logo enviado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção de Banner */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Banner do Restaurante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Enviar Banner</h3>
                      <p className="text-muted-foreground mb-4">
                        Escolha uma imagem do seu dispositivo para usar como banner (máximo 5MB).
                        O banner será usado como imagem de fundo na parte superior do seu cardápio.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Selecionar Arquivo de Imagem
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            disabled={uploadBannerMutation.isPending}
                            className="w-full p-3 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            data-testid="input-banner-file"
                          />
                        </div>
                        
                        {uploadBannerMutation.isPending && (
                          <div className="text-sm text-muted-foreground">
                            Fazendo upload do banner...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Pré-visualização</h3>
                      
                      <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                        {restaurant?.bannerUrl ? (
                          <img 
                            src={`${restaurant.bannerUrl}?t=${Date.now()}`}
                            alt="Banner do restaurante" 
                            className="max-w-full max-h-48 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhum banner enviado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}