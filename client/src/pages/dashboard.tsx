import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ProductForm } from "@/components/product-form";
import { ProductCard } from "@/components/product-card";
import { 
  Home, 
  Package, 
  Settings, 
  FileText, 
  CreditCard,
  LogOut,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("home");
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

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
    queryKey: [`/api/restaurants/${restaurant?.id}/products`],
    enabled: isAuthenticated && !!restaurant,
    retry: false,
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
        <Card>
          <CardHeader>
            <CardTitle>Restaurante não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você precisa configurar seu restaurante primeiro.</p>
            <Button onClick={() => window.location.href = "/"} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { id: "home", label: "Home", icon: Home, hasSubmenu: false },
    { 
      id: "produtos", 
      label: "Produtos", 
      icon: Package, 
      hasSubmenu: true,
      submenu: [
        "Gerenciar produtos",
        "Categorias", 
        "Adicionais",
        "Variações",
        "Consultar o estoque"
      ]
    },
    { 
      id: "configuracoes", 
      label: "Configurações", 
      icon: Settings, 
      hasSubmenu: true,
      submenu: [
        "Meu Cardápio",
        "Mesas",
        "Horarios de funcionamento",
        "Sobre nós",
        "Logo",
        "Banner",
        "Dados da empresa",
        "Configurar WhatsApp",
        "Configurar SEO",
        "Usuários",
        "Faixa de Cep"
      ]
    },
    { id: "comandas", label: "Comandas", icon: FileText, hasSubmenu: false },
    { id: "plano", label: "Plano", icon: CreditCard, hasSubmenu: false },
  ];

  // Contadores de pedidos por status
  const orderCounts = {
    abertos: orders.filter((order: any) => order.status === 'pending').length,
    preparando: orders.filter((order: any) => order.status === 'preparing').length,
    entrega: orders.filter((order: any) => order.status === 'out_for_delivery').length,
    finalizados: orders.filter((order: any) => order.status === 'delivered').length,
    cancelados: orders.filter((order: any) => order.status === 'cancelled').length,
  };

  const handleMenuClick = (itemId: string) => {
    if (menuItems.find(item => item.id === itemId)?.hasSubmenu) {
      setExpandedMenu(expandedMenu === itemId ? null : itemId);
    } else {
      setActiveSection(itemId);
      setExpandedMenu(null);
    }
  };

  const renderContent = () => {
    if (activeSection === "home") {
      return (
        <div className="space-y-6">
          {/* Informações do restaurante */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Abertura</p>
                    <p className="font-semibold">{restaurant.openingTime || "00:00"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fechamento</p>
                    <p className="font-semibold">{restaurant.closingTime || "22:22"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de entrega em minutos</p>
                  <p className="font-semibold text-2xl">{restaurant.deliveryTime || 30}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard de pedidos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{orderCounts.abertos}</p>
                <p className="text-sm text-blue-600">Abertos</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{orderCounts.preparando}</p>
                <p className="text-sm text-yellow-600">Preparando</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{orderCounts.entrega}</p>
                <p className="text-sm text-purple-600">Saiu para entrega</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{orderCounts.finalizados}</p>
                <p className="text-sm text-green-600">Finalizados</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{orderCounts.cancelados}</p>
                <p className="text-sm text-red-600">Cancelados</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (activeSection === "produtos") {
      if (showProductForm) {
        return (
          <div className="p-6">
            <ProductForm
              restaurantId={restaurant.id}
              onSuccess={() => setShowProductForm(false)}
              onCancel={() => setShowProductForm(false)}
            />
          </div>
        );
      }

      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Produtos</h2>
            <Button 
              onClick={() => setShowProductForm(true)}
              data-testid="button-add-product"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum produto cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece adicionando seu primeiro produto ao cardápio
                </p>
                <Button 
                  onClick={() => setShowProductForm(true)}
                  data-testid="button-add-first-product"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Produto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 capitalize">{activeSection}</h2>
        <p className="text-muted-foreground">Esta seção está em desenvolvimento.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card shadow-lg border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">RestaurantePro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bem vindo(a), {user?.firstName || user?.email?.split('@')[0] || 'Paulo'} teste!
          </p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  activeSection === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
                data-testid={`menu-${item.id}`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.hasSubmenu && (
                  expandedMenu === item.id ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Submenu */}
              {item.hasSubmenu && expandedMenu === item.id && (
                <div className="mt-2 ml-6 space-y-1">
                  {item.submenu?.map((subitem, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (item.id === "produtos" && index === 0) {
                          setActiveSection("produtos");
                          setExpandedMenu(null);
                        }
                      }}
                      className="w-full text-left p-2 text-sm hover:bg-muted rounded-lg transition-colors"
                      data-testid={`submenu-${item.id}-${index}`}
                    >
                      {subitem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => window.location.href = "/api/logout"}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            data-testid="menu-sair"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-card shadow-sm border-b p-4">
          <h2 className="text-xl font-semibold capitalize">
            {activeSection === "home" ? restaurant.name : activeSection}
          </h2>
        </header>

        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}