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
import { CategoryForm } from "@/components/category-form";
import { CategoryList } from "@/components/category-list";
import { AdditionalForm } from "@/components/additional-form";
import { AdditionalList } from "@/components/additional-list";
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
  Plus,
  Edit,
  Trash2,
  QrCode,
  Users
} from "lucide-react";


export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("home");
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAdditionalForm, setShowAdditionalForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingAdditional, setEditingAdditional] = useState<any>(null);
  const [productSubSection, setProductSubSection] = useState("produtos");

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ["/api/dev/my-restaurant"], // Usar rota de desenvolvimento
    enabled: isAuthenticated && (user as any)?.role === "restaurant_owner",
    retry: false,
  });

  // Debug log
  console.log("Dashboard Debug:", {
    isAuthenticated,
    userRole: (user as any)?.role,
    restaurant,
    restaurantLoading,
    activeSection,
    productSubSection
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/my-orders"],
    enabled: isAuthenticated && !!restaurant,
    retry: false,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/restaurants/${(restaurant as any)?.id}/products`],
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
    abertos: (orders as any[]).filter((order: any) => order.status === 'pending').length,
    preparando: (orders as any[]).filter((order: any) => order.status === 'preparing').length,
    entrega: (orders as any[]).filter((order: any) => order.status === 'out_for_delivery').length,
    finalizados: (orders as any[]).filter((order: any) => order.status === 'delivered').length,
    cancelados: (orders as any[]).filter((order: any) => order.status === 'cancelled').length,
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
                    <p className="font-semibold">{(restaurant as any).openingTime || "00:00"}</p>
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
                    <p className="font-semibold">{(restaurant as any).closingTime || "22:22"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de entrega em minutos</p>
                  <p className="font-semibold text-2xl">{(restaurant as any).deliveryTime || 30}</p>
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
      const renderProductSubContent = () => {
        // Gerenciar Produtos
        if (productSubSection === "produtos") {
          if (showProductForm) {
            return (
              <ProductForm
                restaurantId={(restaurant as any).id}
                onSuccess={() => setShowProductForm(false)}
                onCancel={() => setShowProductForm(false)}
              />
            );
          }

          return (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Gerenciar Produtos</h3>
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
              ) : (products as any[]).length === 0 ? (
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
                  {(products as any[]).map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Gerenciar Categorias
        if (productSubSection === "categorias") {
          if (showCategoryForm || editingCategory) {
            return (
              <CategoryForm
                restaurantId={(restaurant as any).id}
                category={editingCategory}
                onSuccess={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              />
            );
          }

          return (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Gerenciar Categorias</h3>
                <Button 
                  onClick={() => setShowCategoryForm(true)}
                  data-testid="button-add-category"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
              <CategoryList 
                restaurantId={(restaurant as any).id}
                onEdit={(category) => setEditingCategory(category)}
              />
            </div>
          );
        }

        // Gerenciar Adicionais
        if (productSubSection === "adicionais") {
          if (showAdditionalForm || editingAdditional) {
            return (
              <AdditionalForm
                restaurantId={(restaurant as any).id}
                additional={editingAdditional}
                onSuccess={() => {
                  setShowAdditionalForm(false);
                  setEditingAdditional(null);
                }}
                onCancel={() => {
                  setShowAdditionalForm(false);
                  setEditingAdditional(null);
                }}
              />
            );
          }

          return (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Gerenciar Adicionais</h3>
                <Button 
                  onClick={() => setShowAdditionalForm(true)}
                  data-testid="button-add-additional"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Adicional
                </Button>
              </div>
              <AdditionalList 
                restaurantId={(restaurant as any).id}
                onEdit={(additional) => setEditingAdditional(additional)}
              />
            </div>
          );
        }

        return null;
      };

      return (
        <div className="p-6">
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-green-600">🎉 PRODUTOS - SISTEMA ATUALIZADO COM SUCESSO! 🎉</h2>
              <p className="text-sm text-green-500 font-semibold">Agora você pode gerenciar Produtos, Categorias e Adicionais nas abas abaixo!</p>
            </div>
            
            {/* Abas de navegação */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setProductSubSection("produtos")}
                className={`px-4 py-2 font-medium transition-colors ${
                  productSubSection === "produtos"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-produtos"
              >
                Produtos
              </button>
              <button
                onClick={() => setProductSubSection("categorias")}
                className={`px-4 py-2 font-medium transition-colors ${
                  productSubSection === "categorias"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-categorias"
              >
                Categorias
              </button>
              <button
                onClick={() => setProductSubSection("adicionais")}
                className={`px-4 py-2 font-medium transition-colors ${
                  productSubSection === "adicionais"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-adicionais"
              >
                Adicionais
              </button>
            </div>
          </div>

          {/* Conteúdo da aba ativa */}
          {renderProductSubContent()}
        </div>
      );
    }

    if (activeSection === "mesas") {
      const { toast } = useToast();
      const [showTableForm, setShowTableForm] = useState(false);
      const [editingTable, setEditingTable] = useState<any>(null);

      const { data: tables = [], isLoading: tablesLoading } = useQuery({
        queryKey: ["/api/dev/tables"],
        enabled: !!restaurant,
        retry: false,
      });

      const createTableMutation = useMutation({
        mutationFn: (data: any) => apiRequest("/api/dev/tables", {
          method: "POST",
          body: JSON.stringify(data),
        }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/dev/tables"] });
          setShowTableForm(false);
          toast({
            title: "Mesa criada!",
            description: "A mesa foi criada com sucesso.",
          });
        },
        onError: (error) => {
          console.error("Error creating table:", error);
          toast({
            title: "Erro",
            description: "Falha ao criar mesa.",
            variant: "destructive",
          });
        },
      });

      const updateTableMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => apiRequest(`/api/dev/tables/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/dev/tables"] });
          setEditingTable(null);
          toast({
            title: "Mesa atualizada!",
            description: "A mesa foi atualizada com sucesso.",
          });
        },
        onError: (error) => {
          console.error("Error updating table:", error);
          toast({
            title: "Erro",
            description: "Falha ao atualizar mesa.",
            variant: "destructive",
          });
        },
      });

      const deleteTableMutation = useMutation({
        mutationFn: (id: string) => apiRequest(`/api/dev/tables/${id}`, {
          method: "DELETE",
        }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/dev/tables"] });
          toast({
            title: "Mesa excluída!",
            description: "A mesa foi excluída com sucesso.",
          });
        },
        onError: (error) => {
          console.error("Error deleting table:", error);
          toast({
            title: "Erro",
            description: "Falha ao excluir mesa.",
            variant: "destructive",
          });
        },
      });

      const handleCreateTable = (formData: any) => {
        createTableMutation.mutate(formData);
      };

      const handleUpdateTable = (formData: any) => {
        if (editingTable) {
          updateTableMutation.mutate({ id: editingTable.id, data: formData });
        }
      };

      const handleDeleteTable = (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta mesa?")) {
          deleteTableMutation.mutate(id);
        }
      };

      if (tablesLoading) {
        return (
          <div className="p-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        );
      }

      const TableForm = ({ table, onSubmit, onCancel, isLoading }: { 
        table?: any, 
        onSubmit: (data: any) => void, 
        onCancel: () => void,
        isLoading: boolean 
      }) => {
        const [formData, setFormData] = useState({
          number: table?.number || "",
          name: table?.name || "",
          capacity: table?.capacity || 4,
          isActive: table?.isActive ?? true,
        });

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          
          if (!formData.number) {
            return;
          }

          onSubmit(formData);
        };

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {table ? "Editar Mesa" : "Adicionar Mesa"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Número da Mesa *
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ex: 1, A1, VIP1"
                      data-testid="input-table-number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome da Mesa (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ex: Mesa da Janela, VIP"
                      data-testid="input-table-name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Capacidade (pessoas)
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                      className="w-full border rounded-lg px-3 py-2"
                      min="1"
                      max="20"
                      data-testid="input-table-capacity"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      data-testid="checkbox-table-active"
                    />
                    <label htmlFor="isActive" className="text-sm">
                      Mesa ativa
                    </label>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="flex-1"
                      data-testid="button-save-table"
                    >
                      {isLoading ? "Salvando..." : (table ? "Atualizar" : "Criar Mesa")}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onCancel}
                      disabled={isLoading}
                      data-testid="button-cancel-table"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        );
      };

      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gerenciar Mesas</h2>
            <Button 
              onClick={() => setShowTableForm(true)}
              data-testid="button-add-table"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Mesa
            </Button>
          </div>

          {/* Lista de mesas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table: any) => (
              <Card key={table.id} className="p-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Mesa {table.number}</span>
                    <Badge variant={table.isActive ? "default" : "secondary"}>
                      {table.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{table.capacity} pessoas</span>
                  </div>
                  {table.name && (
                    <div className="text-sm text-muted-foreground">
                      Nome: {table.name}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 pt-2">
                    <QrCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {table.qrCode}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2 pt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingTable(table)}
                      data-testid={`button-edit-table-${table.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteTable(table.id)}
                      data-testid={`button-delete-table-${table.id}`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {tables.length === 0 && (
              <Card className="col-span-full p-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    Nenhuma mesa cadastrada ainda. Clique em "Adicionar Mesa" para começar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Formulário de criar/editar mesa */}
          {(showTableForm || editingTable) && (
            <TableForm
              table={editingTable}
              onSubmit={editingTable ? handleUpdateTable : handleCreateTable}
              onCancel={() => {
                setShowTableForm(false);
                setEditingTable(null);
              }}
              isLoading={createTableMutation.isPending || updateTableMutation.isPending}
            />
          )}
        </div>
      );
    }

    if (activeSection === "horarios") {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Horários de Funcionamento</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Horários por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Configure os horários de funcionamento para cada dia da semana. 
                  Estes horários ficarão visíveis para todos os clientes.
                </p>
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
                  🚧 Esta funcionalidade está sendo implementada e estará disponível em breve!
                </p>
              </CardContent>
            </Card>
          </div>
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
            Bem vindo(a), {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'Paulo'} teste!
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
                        } else if (item.id === "configuracoes") {
                          if (index === 0) { // "Meu Cardápio"
                            window.open(`/menu/${(restaurant as any).id}`, '_blank');
                          } else if (index === 1) { // "Mesas"
                            setActiveSection("mesas");
                            setExpandedMenu(null);
                          } else if (index === 2) { // "Horários de funcionamento"
                            setActiveSection("horarios");
                            setExpandedMenu(null);
                          }
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
            {activeSection === "home" ? (restaurant as any).name : activeSection}
          </h2>
        </header>

        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}