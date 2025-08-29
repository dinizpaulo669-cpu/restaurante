import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OrderCard } from "@/components/order-card";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Percent,
  Plus,
  Edit,
  Trash2,
  Printer,
  Settings,
  Users,
  Clock,
  Building,
  Phone,
  Map
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("overview");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ["/api/my-restaurant"],
    enabled: isAuthenticated && user?.role === "restaurant_owner",
    retry: false,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/my-orders"],
    enabled: isAuthenticated && !!restaurant,
    retry: false,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/restaurants", restaurant?.id, "products"],
    enabled: !!restaurant?.id,
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

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
      toast({
        title: "Status Atualizado",
        description: "O status do pedido foi atualizado com sucesso!",
      });
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
        description: "Falha ao atualizar status do pedido",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("POST", "/api/products", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurant?.id, "products"] });
      setIsProductDialogOpen(false);
      toast({
        title: "Produto Adicionado",
        description: "O produto foi adicionado ao seu cardápio!",
      });
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
        description: "Falha ao adicionar produto",
        variant: "destructive",
      });
    },
  });

  if (isLoading || restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle data-testid="no-restaurant-title">Restaurante não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4" data-testid="no-restaurant-message">
              Você precisa configurar seu restaurante primeiro.
            </p>
            <Button 
              onClick={() => window.location.href = "/sales"}
              className="w-full"
              data-testid="button-setup-restaurant"
            >
              Configurar Restaurante
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate dashboard stats
  const todayOrders = orders.filter(order => {
    const today = new Date();
    const orderDate = new Date(order.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const averageTicket = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

  const handleProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      imageUrl: formData.get("imageUrl") as string,
    };
    createProductMutation.mutate(productData);
  };

  const handlePrintOrder = (orderId: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const order = orders.find(o => o.id === orderId);
      printWindow.document.write(`
        <html>
          <head><title>Pedido #${order?.orderNumber}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Pedido #${order?.orderNumber}</h2>
            <p><strong>Cliente:</strong> ${order?.customerName}</p>
            <p><strong>Telefone:</strong> ${order?.customerPhone}</p>
            <p><strong>Status:</strong> ${order?.status}</p>
            <p><strong>Total:</strong> R$ ${order?.total}</p>
            <p><strong>Data:</strong> ${new Date(order?.createdAt || '').toLocaleString('pt-BR')}</p>
          </body>
        </html>
      `);
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <DashboardLayout
      restaurant={restaurant}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm" data-testid="stat-orders-label">Pedidos Hoje</p>
                    <p className="text-3xl font-bold" data-testid="stat-orders-value">{todayOrders.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500 text-sm">Ativo</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm" data-testid="stat-revenue-label">Receita Hoje</p>
                    <p className="text-3xl font-bold" data-testid="stat-revenue-value">R$ {todayRevenue.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500 text-sm">Em crescimento</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm" data-testid="stat-ticket-label">Ticket Médio</p>
                    <p className="text-3xl font-bold" data-testid="stat-ticket-value">R$ {averageTicket.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm" data-testid="stat-products-label">Produtos Ativos</p>
                    <p className="text-3xl font-bold" data-testid="stat-products-value">
                      {products.filter(p => p.isActive).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Percent className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="recent-orders-title">Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 bg-muted rounded-lg">
                      <div className="h-6 bg-muted-foreground/20 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="no-orders-message">
                  Nenhum pedido ainda. Quando você receber pedidos, eles aparecerão aqui.
                </p>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={(status) => 
                        updateOrderStatusMutation.mutate({ orderId: order.id, status })
                      }
                      onPrint={() => handlePrintOrder(order.id)}
                      isUpdatingStatus={updateOrderStatusMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              variant="outline"
              onClick={() => setActiveSection("products")}
              className="h-24 flex-col space-y-2"
              data-testid="button-quick-add-product"
            >
              <Plus className="h-6 w-6" />
              <span>Adicionar Produto</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setActiveSection("orders")}
              className="h-24 flex-col space-y-2"
              data-testid="button-quick-view-orders"
            >
              <ShoppingCart className="h-6 w-6" />
              <span>Ver Comandas</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setActiveSection("config")}
              className="h-24 flex-col space-y-2"
              data-testid="button-quick-settings"
            >
              <Settings className="h-6 w-6" />
              <span>Configurações</span>
            </Button>
          </div>
        </div>
      )}

      {/* Products Section */}
      {activeSection === "products" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold" data-testid="products-title">Produtos</h2>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle data-testid="dialog-title-add-product">Adicionar Produto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" name="name" required data-testid="input-product-name" />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" data-testid="input-product-description" />
                  </div>
                  <div>
                    <Label htmlFor="price">Preço</Label>
                    <Input id="price" name="price" type="number" step="0.01" required data-testid="input-product-price" />
                  </div>
                  <div>
                    <Label htmlFor="imageUrl">URL da Imagem</Label>
                    <Input id="imageUrl" name="imageUrl" type="url" data-testid="input-product-image" />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createProductMutation.isPending}
                    data-testid="button-save-product"
                  >
                    {createProductMutation.isPending ? "Salvando..." : "Salvar Produto"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products" data-testid="tab-products">Gerenciar Produtos</TabsTrigger>
              <TabsTrigger value="categories" data-testid="tab-categories">Categorias</TabsTrigger>
              <TabsTrigger value="additionals" data-testid="tab-additionals">Adicionais</TabsTrigger>
              <TabsTrigger value="variations" data-testid="tab-variations">Variações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="space-y-4">
              {productsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 bg-muted rounded-lg h-24"></div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground" data-testid="no-products-message">
                      Você ainda não tem produtos cadastrados. Adicione seu primeiro produto para começar!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground" data-testid="categories-placeholder">
                    Gestão de categorias será implementada em breve.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additionals" className="space-y-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground" data-testid="additionals-placeholder">
                    Gestão de adicionais será implementada em breve.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variations" className="space-y-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground" data-testid="variations-placeholder">
                    Gestão de variações será implementada em breve.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Orders Section */}
      {activeSection === "orders" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold" data-testid="orders-title">Comandas</h2>
            <div className="flex items-center space-x-4">
              <Select>
                <SelectTrigger className="w-48" data-testid="select-order-filter">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="ready">Pronto</SelectItem>
                  <SelectItem value="out_for_delivery">A caminho</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] })}
                data-testid="button-refresh-orders"
              >
                <i className="fas fa-sync mr-2"></i>
                Atualizar
              </Button>
            </div>
          </div>

          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-6 bg-muted rounded-lg h-32"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground" data-testid="no-orders-message">
                  Você ainda não tem pedidos. Quando os clientes fizerem pedidos, eles aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={(status) => 
                    updateOrderStatusMutation.mutate({ orderId: order.id, status })
                  }
                  onPrint={() => handlePrintOrder(order.id)}
                  isUpdatingStatus={updateOrderStatusMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Configuration Section */}
      {activeSection === "config" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold" data-testid="config-title">Configurações</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Restaurant Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4" data-testid="restaurant-settings-title">Configurações do Restaurante</h3>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-menu">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-utensils text-primary"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Meu Cardápio</h4>
                      <p className="text-sm text-muted-foreground">Gerencie produtos e categorias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-tables">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-chair text-primary"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Mesas</h4>
                      <p className="text-sm text-muted-foreground">Configure mesas e layout do restaurante</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-hours">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Horários de Funcionamento</h4>
                      <p className="text-sm text-muted-foreground">Defina horários de abertura e fechamento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-about">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-info-circle text-primary"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Sobre Nós</h4>
                      <p className="text-sm text-muted-foreground">Descrição e informações do restaurante</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-logo">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-image text-primary"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Logo</h4>
                      <p className="text-sm text-muted-foreground">Faça upload do logo do seu restaurante</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-banner">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-panorama text-primary"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Banner</h4>
                      <p className="text-sm text-muted-foreground">Imagem de destaque do restaurante</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4" data-testid="business-settings-title">Configurações Empresariais</h3>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-company-data">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <Building className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium">Dados da Empresa</h4>
                      <p className="text-sm text-muted-foreground">CNPJ, endereço e informações fiscais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-whatsapp">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Configurar WhatsApp</h4>
                      <p className="text-sm text-muted-foreground">Integração com WhatsApp Business</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-seo">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-search text-blue-500"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Configurar SEO</h4>
                      <p className="text-sm text-muted-foreground">Otimização para mecanismos de busca</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-users">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Usuários</h4>
                      <p className="text-sm text-muted-foreground">Gerencie equipe e permissões</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="config-delivery-area">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center">
                      <Map className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Faixa de CEP</h4>
                      <p className="text-sm text-muted-foreground">Área de entrega do restaurante</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
