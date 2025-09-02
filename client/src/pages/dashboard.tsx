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
  Users,
  Search,
  AlertTriangle,
  Package2
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
  const [configurationSubSection, setConfigurationSubSection] = useState("dados-empresa");
  
  // Estados para mesas
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  
  // Estados para consulta de estoque
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockSortBy, setStockSortBy] = useState<"name" | "stock">("stock");
  
  // Estados para horários de funcionamento
  const [openingHours, setOpeningHours] = useState({
    segunda: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    terca: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    quarta: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    quinta: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    sexta: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    sabado: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
    domingo: { isOpen: false, openTime: '09:00', closeTime: '16:00' }
  });
  const [isEditingHours, setIsEditingHours] = useState(false);
  
  // Estados para abas extras - movidos para o topo para evitar erro de hooks
  const [description, setDescription] = useState("");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Estados para configurações - movidos para o topo para evitar erro de hooks
  const [isEditingCompanyData, setIsEditingCompanyData] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    email: "",
  });
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [selectedSeoCategories, setSelectedSeoCategories] = useState<string[]>([]);
  
  // Estados para gerenciamento de usuários
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    permissions: [] as string[]
  });
  
  // Estados para configuração de CEP
  const [cepRange, setCepRange] = useState({
    start: "",
    end: "",
    deliveryFee: "",
    minTime: "",
    maxTime: ""
  });

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

  // Queries para mesas
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ["/api/dev/tables"],
    enabled: !!restaurant,
    retry: false,
  });

  // Atualizar estados quando restaurant carrega
  useEffect(() => {
    if (restaurant) {
      setDescription((restaurant as any)?.description || "");
      setLogoUrl((restaurant as any)?.logoUrl || "");
      setBannerUrl((restaurant as any)?.bannerUrl || "");
      setCompanyFormData({
        name: (restaurant as any)?.name || "",
        description: (restaurant as any)?.description || "",
        category: (restaurant as any)?.category || "",
        address: (restaurant as any)?.address || "",
        phone: (restaurant as any)?.phone || "",
        email: (restaurant as any)?.email || "",
      });
      setWhatsappNumber((restaurant as any)?.whatsappNumber || "");
    }
  }, [restaurant]);

  // Mutations para mesas
  const createTableMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/dev/tables", data),
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
    mutationFn: ({ id, data }: { id: string, data: any }) => apiRequest("PUT", `/api/dev/tables/${id}`, data),
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
    mutationFn: (id: string) => apiRequest("DELETE", `/api/dev/tables/${id}`),
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

  // Mutations para configurações - movidas para o topo para evitar erro de hooks
  const updateCompanyDataMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/dev/restaurant/company-data", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Dados atualizados!",
        description: "Os dados da empresa foram atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateWhatsAppMutation = useMutation({
    mutationFn: (whatsappNumber: string) => apiRequest("PUT", "/api/dev/restaurant/whatsapp", { whatsappNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "WhatsApp configurado!",
        description: "O número do WhatsApp foi configurado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao configurar",
        description: "Não foi possível configurar o WhatsApp. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutations para atualizar informações do restaurante
  const updateAboutMutation = useMutation({
    mutationFn: (description: string) => apiRequest("PUT", "/api/dev/restaurant/about", { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Descrição atualizada!",
        description: "A descrição 'Sobre Nós' foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar descrição.",
        variant: "destructive",
      });
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: (logoUrl: string) => apiRequest("PUT", "/api/dev/restaurant/logo", { logoUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Logo atualizado!",
        description: "O logo do restaurante foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar logo.",
        variant: "destructive",
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: (bannerUrl: string) => apiRequest("PUT", "/api/dev/restaurant/banner", { bannerUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Banner atualizado!",
        description: "O banner do restaurante foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar banner.",
        variant: "destructive",
      });
    },
  });

  // Handlers para mesas
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
        "Consultar o estoque"
      ]
    },
    { id: "mesas", label: "Mesas", icon: Users, hasSubmenu: false },
    { id: "horarios", label: "Horários", icon: Clock, hasSubmenu: false },
    { id: "sobre-nos", label: "Sobre Nós", icon: FileText, hasSubmenu: false },
    { id: "logo", label: "Logo", icon: Edit, hasSubmenu: false },
    { id: "banner", label: "Banner", icon: Package, hasSubmenu: false },
    { id: "comandas", label: "Comandas", icon: FileText, hasSubmenu: false },
    { 
      id: "configuracoes", 
      label: "Configurações", 
      icon: Settings, 
      hasSubmenu: true,
      submenu: [
        "Dados da empresa",
        "Configurar WhatsApp",
        "Configurar SEO",
        "Usuários",
        "Faixa de Cep"
      ]
    },
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
              <h2 className="text-2xl font-bold text-primary">Gerenciar Produtos</h2>
              <p className="text-sm text-muted-foreground">Gerencie seu cardápio de produtos de forma simples e eficiente.</p>
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

    // Seção de consulta de estoque
    if (activeSection === "estoque") {
      const filteredProducts = (products as any[])
        .filter(product => 
          product.name.toLowerCase().includes(stockSearchTerm.toLowerCase())
        )
        .sort((a, b) => {
          if (stockSortBy === "stock") {
            return (a.stock || 0) - (b.stock || 0); // Menor estoque primeiro
          } else {
            return a.name.localeCompare(b.name);
          }
        });

      const lowStockProducts = filteredProducts.filter(product => (product.stock || 0) < 10);

      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Package2 className="w-6 h-6 mr-2" />
            Consultar Estoque
          </h2>

          {/* Alertas de estoque baixo */}
          {lowStockProducts.length > 0 && (
            <Card className="mb-6 bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-orange-800">
                    Alerta de Estoque Baixo
                  </h3>
                </div>
                <p className="text-orange-700 mb-3">
                  {lowStockProducts.length} produto(s) com menos de 10 unidades em estoque:
                </p>
                <div className="space-y-2">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex justify-between items-center bg-white rounded-lg p-2 border border-orange-200">
                      <span className="font-medium">{product.name}</span>
                      <Badge variant="destructive" data-testid={`low-stock-${product.id}`}>
                        {product.stock || 0} unidades
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controles de filtro e busca */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                value={stockSearchTerm}
                onChange={(e) => setStockSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-stock-search"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={stockSortBy === "stock" ? "default" : "outline"}
                onClick={() => setStockSortBy("stock")}
                data-testid="button-sort-stock"
              >
                Ordenar por Estoque
              </Button>
              <Button
                variant={stockSortBy === "name" ? "default" : "outline"}
                onClick={() => setStockSortBy("name")}
                data-testid="button-sort-name"
              >
                Ordenar por Nome
              </Button>
            </div>
          </div>

          {/* Lista de produtos com estoque */}
          {productsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {stockSearchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                </h3>
                <p className="text-muted-foreground">
                  {stockSearchTerm 
                    ? "Tente ajustar sua pesquisa ou cadastre novos produtos"
                    : "Adicione produtos ao seu cardápio para visualizar o estoque"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product: any) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.description && (
                          <p className="text-muted-foreground text-sm mt-1">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">
                            Preço: R$ {Number(product.price).toFixed(2)}
                          </span>
                          {product.costPrice && (
                            <span className="text-sm text-muted-foreground">
                              Custo: R$ {Number(product.costPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Estoque:</span>
                        </div>
                        <div className="mt-1">
                          <Badge 
                            variant={(product.stock || 0) < 10 ? "destructive" : "secondary"}
                            className="text-base px-3 py-1"
                            data-testid={`stock-${product.id}`}
                          >
                            {product.stock || 0} unidades
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeSection === "mesas") {
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
            {(tables as any[]).map((table: any) => (
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
                  
                  <div className="mt-3 pt-3 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/menu/' + (restaurant as any).id + '?table=' + table.qrCode)}`;
                        const link = document.createElement('a');
                        link.href = qrUrl;
                        link.download = `qr-mesa-${table.number}.png`;
                        link.click();
                      }}
                      className="w-full"
                      data-testid={`button-download-qr-${table.id}`}
                    >
                      <QrCode className="w-3 h-3 mr-1" />
                      Baixar QR Code
                    </Button>
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
            
            {(tables as any[]).length === 0 && (
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
      const dayNames = {
        segunda: 'Segunda-feira',
        terca: 'Terça-feira',
        quarta: 'Quarta-feira',
        quinta: 'Quinta-feira',
        sexta: 'Sexta-feira',
        sabado: 'Sábado',
        domingo: 'Domingo'
      };

      const handleDayChange = (day: string, field: string, value: any) => {
        setOpeningHours(prev => ({
          ...prev,
          [day]: {
            ...prev[day as keyof typeof prev],
            [field]: value
          }
        }));
      };

      const saveOpeningHours = () => {
        // TODO: Implementar salvamento no backend
        setIsEditingHours(false);
        toast({
          title: "Horários salvos!",
          description: "Os horários de funcionamento foram atualizados com sucesso.",
        });
      };

      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Horários de Funcionamento</h2>
            <Button 
              onClick={() => setIsEditingHours(!isEditingHours)}
              variant={isEditingHours ? "outline" : "default"}
              data-testid="button-edit-hours"
            >
              {isEditingHours ? "Cancelar" : "Editar Horários"}
            </Button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(openingHours).map(([day, hours]) => (
              <Card key={day} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <h3 className="font-medium">{dayNames[day as keyof typeof dayNames]}</h3>
                      </div>
                      
                      {isEditingHours ? (
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={hours.isOpen}
                              onChange={(e) => handleDayChange(day, 'isOpen', e.target.checked)}
                              className="rounded"
                              data-testid={`checkbox-${day}-open`}
                            />
                            <span className="text-sm">Aberto</span>
                          </label>
                          
                          {hours.isOpen && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={hours.openTime}
                                onChange={(e) => handleDayChange(day, 'openTime', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                                data-testid={`input-${day}-open-time`}
                              />
                              <span className="text-sm text-muted-foreground">às</span>
                              <input
                                type="time"
                                value={hours.closeTime}
                                onChange={(e) => handleDayChange(day, 'closeTime', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                                data-testid={`input-${day}-close-time`}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                          {hours.isOpen ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-700">
                                {hours.openTime} às {hours.closeTime}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-medium text-red-700">Fechado</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {isEditingHours && (
            <div className="mt-6 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditingHours(false)}
                data-testid="button-cancel-hours"
              >
                Cancelar
              </Button>
              <Button 
                onClick={saveOpeningHours}
                data-testid="button-save-hours"
              >
                Salvar Horários
              </Button>
            </div>
          )}
          
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Os horários configurados aqui serão exibidos para os clientes no cardápio online</span>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSection === "sobre-nos") {
      const handleSave = () => {
        updateAboutMutation.mutate(description);
        setIsEditingAbout(false);
      };

      return (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Sobre Nós
            </h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Descrição do Restaurante</h3>
                  <Button
                    onClick={() => isEditingAbout ? handleSave() : setIsEditingAbout(true)}
                    disabled={updateAboutMutation.isPending}
                    data-testid="button-edit-about"
                  >
                    {isEditingAbout ? (
                      updateAboutMutation.isPending ? "Salvando..." : "Salvar"
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                </div>
                
                {isEditingAbout ? (
                  <div className="space-y-4">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Conte sobre seu restaurante, especialidades, história..."
                      className="w-full h-32 p-3 border rounded-lg resize-none"
                      data-testid="textarea-about"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={updateAboutMutation.isPending}>
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingAbout(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {description ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Nenhuma descrição cadastrada. Clique em "Editar" para adicionar uma descrição sobre seu restaurante.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (activeSection === "logo") {
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
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
          toast({
            title: "Logo atualizado!",
            description: "O logo foi enviado e atualizado com sucesso.",
          });
        },
        onError: () => {
          toast({
            title: "Erro no upload",
            description: "Não foi possível fazer upload do logo. Tente novamente.",
            variant: "destructive",
          });
        },
      });

      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      return (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Edit className="w-6 h-6 mr-2" />
              Logo do Restaurante
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
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
                        onChange={handleFileUpload}
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
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Pré-visualização</h3>
                  
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                    {(restaurant as any)?.logoUrl ? (
                      <img 
                        src={(restaurant as any).logoUrl} 
                        alt="Logo do restaurante" 
                        className="max-w-full max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Edit className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum logo configurado ainda</p>
                        <p className="text-sm">Faça upload de uma imagem</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "banner") {
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
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
          toast({
            title: "Banner atualizado!",
            description: "O banner foi enviado e atualizado com sucesso.",
          });
        },
        onError: () => {
          toast({
            title: "Erro no upload",
            description: "Não foi possível fazer upload do banner. Tente novamente.",
            variant: "destructive",
          });
        },
      });

      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      return (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Package className="w-6 h-6 mr-2" />
              Banner do Restaurante
            </h2>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
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
                        onChange={handleFileUpload}
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
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Pré-visualização</h3>
                  
                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                    {(restaurant as any)?.bannerUrl ? (
                      <div className="relative h-48 w-full">
                        <img 
                          src={(restaurant as any).bannerUrl} 
                          alt="Banner do restaurante" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="text-white text-center">
                            <h3 className="text-2xl font-bold">{(restaurant as any)?.name}</h3>
                            <p className="text-lg">{(restaurant as any)?.description}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-center text-muted-foreground">
                        <div>
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum banner configurado ainda</p>
                          <p className="text-sm">Faça upload de uma imagem</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "configuracoes") {

      const renderConfigurationContent = () => {
        if (configurationSubSection === "dados-empresa") {
          const handleSave = () => {
            updateCompanyDataMutation.mutate(companyFormData);
            setIsEditingCompanyData(false);
          };

          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Dados da Empresa</h3>
                <Button
                  onClick={() => setIsEditingCompanyData(!isEditingCompanyData)}
                  variant="outline"
                  data-testid="button-edit-company-data"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditingCompanyData ? "Cancelar" : "Editar"}
                </Button>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome do Restaurante</label>
                      {isEditingCompanyData ? (
                        <input
                          type="text"
                          value={companyFormData.name}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-company-name"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-name">
                          {companyFormData.name || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Categoria</label>
                      {isEditingCompanyData ? (
                        <select
                          value={companyFormData.category}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="select-company-category"
                        >
                          <option value="">Selecione uma categoria</option>
                          <option value="italiana">Italiana</option>
                          <option value="brasileira">Brasileira</option>
                          <option value="japonesa">Japonesa</option>
                          <option value="mexicana">Mexicana</option>
                          <option value="pizza">Pizza</option>
                          <option value="hamburguer">Hambúrguer</option>
                          <option value="vegetariana">Vegetariana</option>
                          <option value="doces">Doces</option>
                        </select>
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-category">
                          {companyFormData.category || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Descrição</label>
                      {isEditingCompanyData ? (
                        <textarea
                          value={companyFormData.description}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full p-3 border rounded-lg"
                          data-testid="textarea-company-description"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-description">
                          {companyFormData.description || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Endereço</label>
                      {isEditingCompanyData ? (
                        <input
                          type="text"
                          value={companyFormData.address}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-company-address"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-address">
                          {companyFormData.address || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Telefone</label>
                      {isEditingCompanyData ? (
                        <input
                          type="tel"
                          value={companyFormData.phone}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-company-phone"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-phone">
                          {companyFormData.phone || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      {isEditingCompanyData ? (
                        <input
                          type="email"
                          value={companyFormData.email}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-company-email"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-email">
                          {companyFormData.email || "Não informado"}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditingCompanyData && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSave}
                        disabled={updateCompanyDataMutation.isPending}
                        data-testid="button-save-company-data"
                      >
                        {updateCompanyDataMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingCompanyData(false)}
                        data-testid="button-cancel-company-data"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }

        if (configurationSubSection === "whatsapp") {
          const handleSaveWhatsApp = () => {
            if (whatsappNumber.trim()) {
              updateWhatsAppMutation.mutate(whatsappNumber.trim());
            }
          };

          return (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Configurar WhatsApp</h3>
              
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Número para Notificações</h4>
                  <p className="text-muted-foreground mb-4">
                    Configure o número do WhatsApp que será usado para enviar notificações aos clientes sobre seus pedidos.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Número do WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full p-3 border rounded-lg"
                        data-testid="input-whatsapp-number"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use o formato: (11) 99999-9999 ou +55 11 99999-9999
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleSaveWhatsApp}
                      disabled={!whatsappNumber.trim() || updateWhatsAppMutation.isPending}
                      className="w-full"
                      data-testid="button-save-whatsapp"
                    >
                      {updateWhatsAppMutation.isPending ? "Salvando..." : "Salvar Número"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {whatsappNumber && (
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Preview da Notificação</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">📱</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Notificação para: {whatsappNumber}</p>
                          <p className="text-sm text-green-700 mt-1">
                            "Olá! Seu pedido #{"{"}orderId{"}"} foi confirmado e está sendo preparado. 
                            Tempo estimado: 30-45 minutos. - {(restaurant as any)?.name}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        }

        if (configurationSubSection === "seo") {
          const seoCategories = [
            "Lanches", "Hotdog", "Pastel", "Sorvetes", "Doces", 
            "Almoço", "Açai", "Bebidas"
          ];
          
          const toggleCategory = (category: string) => {
            setSelectedSeoCategories(prev => 
              prev.includes(category) 
                ? prev.filter(c => c !== category)
                : [...prev, category]
            );
          };

          return (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Configurar SEO</h3>
              
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Categorias do Restaurante</h4>
                  <p className="text-muted-foreground mb-4">
                    Selecione as categorias que seu restaurante atende para melhorar a visibilidade nos resultados de busca.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {seoCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          selectedSeoCategories.includes(category)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                        data-testid={`category-${category.toLowerCase()}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  
                  {selectedSeoCategories.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-medium mb-2">Categorias Selecionadas:</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedSeoCategories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-6"
                    disabled={selectedSeoCategories.length === 0}
                    data-testid="button-save-seo"
                  >
                    Salvar Configurações de SEO
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        }

        if (configurationSubSection === "usuarios") {
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Gerenciar Usuários</h3>
                <Button
                  onClick={() => setIsCreatingUser(!isCreatingUser)}
                  data-testid="button-new-user"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
              
              {isCreatingUser && (
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Criar Novo Funcionário</h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Nome Completo</label>
                          <input
                            type="text"
                            value={newUserData.name}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-3 border rounded-lg"
                            placeholder="Nome do funcionário"
                            data-testid="input-user-name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <input
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-3 border rounded-lg"
                            placeholder="email@exemplo.com"
                            data-testid="input-user-email"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Senha</label>
                          <input
                            type="password"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full p-3 border rounded-lg"
                            placeholder="Senha do funcionário"
                            data-testid="input-user-password"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
                          <input
                            type="password"
                            value={newUserData.confirmPassword}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full p-3 border rounded-lg"
                            placeholder="Confirme a senha"
                            data-testid="input-user-confirm-password"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Permissões de Acesso</label>
                        <p className="text-muted-foreground mb-3 text-sm">
                          Selecione quais seções o funcionário poderá acessar no sistema
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {["home", "produtos", "vendas", "mesas", "horarios", "configuracoes"].map((permission) => (
                            <label key={permission} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted transition-colors">
                              <input
                                type="checkbox"
                                checked={newUserData.permissions.includes(permission)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewUserData(prev => ({
                                      ...prev,
                                      permissions: [...prev.permissions, permission]
                                    }));
                                  } else {
                                    setNewUserData(prev => ({
                                      ...prev,
                                      permissions: prev.permissions.filter(p => p !== permission)
                                    }));
                                  }
                                }}
                                className="rounded"
                                data-testid={`checkbox-permission-${permission}`}
                              />
                              <span className="capitalize">{permission === "home" ? "Dashboard" : permission}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => {
                            if (newUserData.password !== newUserData.confirmPassword) {
                              alert("As senhas não coincidem");
                              return;
                            }
                            // Aqui você implementaria a lógica para salvar o usuário
                            console.log("Criando usuário:", newUserData);
                            setIsCreatingUser(false);
                            setNewUserData({
                              name: "",
                              email: "",
                              password: "",
                              confirmPassword: "",
                              permissions: []
                            });
                          }}
                          disabled={!newUserData.name || !newUserData.email || !newUserData.password || newUserData.permissions.length === 0}
                          data-testid="button-save-user"
                        >
                          Criar Funcionário
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreatingUser(false)}
                          data-testid="button-cancel-user"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Funcionários Cadastrados</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Administrador</h5>
                        <p className="text-sm text-muted-foreground">{(user as any)?.email}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">Acesso Total</Badge>
                        </div>
                      </div>
                      <Badge variant="outline">Owner</Badge>
                    </div>
                    
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum funcionário cadastrado ainda</p>
                      <p className="text-sm">Clique em "Novo Usuário" para criar o primeiro funcionário</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }

        if (configurationSubSection === "cep") {
          return (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Faixa de CEP</h3>
              
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Configurar Área de Entrega</h4>
                  <p className="text-muted-foreground mb-4">
                    Defina a faixa de CEP que seu restaurante atende para entregas. Os clientes só poderão fazer pedidos dentro desta área.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">CEP Inicial</label>
                        <input
                          type="text"
                          value={cepRange.start}
                          onChange={(e) => setCepRange(prev => ({ ...prev, start: e.target.value }))}
                          placeholder="00000-000"
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-cep-start"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          CEP menor da sua área de entrega
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">CEP Final</label>
                        <input
                          type="text"
                          value={cepRange.end}
                          onChange={(e) => setCepRange(prev => ({ ...prev, end: e.target.value }))}
                          placeholder="99999-999"
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-cep-end"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          CEP maior da sua área de entrega
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Taxa de Entrega</label>
                      <input
                        type="number"
                        step="0.01"
                        value={cepRange.deliveryFee}
                        onChange={(e) => setCepRange(prev => ({ ...prev, deliveryFee: e.target.value }))}
                        placeholder="0.00"
                        className="w-full p-3 border rounded-lg"
                        data-testid="input-delivery-fee"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor da taxa de entrega em R$ para esta área
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Tempo de Entrega (minutos)</label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          value={cepRange.minTime}
                          onChange={(e) => setCepRange(prev => ({ ...prev, minTime: e.target.value }))}
                          placeholder="30"
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-min-time"
                        />
                        <input
                          type="number"
                          value={cepRange.maxTime}
                          onChange={(e) => setCepRange(prev => ({ ...prev, maxTime: e.target.value }))}
                          placeholder="60"
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-max-time"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tempo mínimo e máximo de entrega para esta área
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => {
                        // Aqui você implementaria a lógica para salvar a faixa de CEP
                        console.log("Salvando faixa de CEP:", cepRange);
                      }}
                      disabled={!cepRange.start || !cepRange.end}
                      className="w-full"
                      data-testid="button-save-cep"
                    >
                      Salvar Configurações de CEP
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {cepRange.start && cepRange.end && (
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Área de Entrega Configurada</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">📍</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Área de Entrega: {cepRange.start} - {cepRange.end}</p>
                          <p className="text-sm text-green-700 mt-1">
                            Taxa: R$ {cepRange.deliveryFee} | Tempo: {cepRange.minTime}-{cepRange.maxTime} minutos
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        }

        return (
          <div className="p-6">
            <h4 className="text-lg font-semibold mb-4">Seção em Desenvolvimento</h4>
            <p className="text-muted-foreground">Esta funcionalidade será implementada em breve.</p>
          </div>
        );
      };

      return (
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Configurações
            </h2>
            
            {/* Abas de navegação */}
            <div className="flex border-b border-border mb-6">
              <button
                onClick={() => setConfigurationSubSection("dados-empresa")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "dados-empresa"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-dados-empresa"
              >
                Dados da Empresa
              </button>
              <button
                onClick={() => setConfigurationSubSection("whatsapp")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "whatsapp"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-whatsapp"
              >
                Configurar WhatsApp
              </button>
              <button
                onClick={() => setConfigurationSubSection("seo")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "seo"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-seo"
              >
                Configurar SEO
              </button>
              <button
                onClick={() => setConfigurationSubSection("usuarios")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "usuarios"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-usuarios"
              >
                Usuários
              </button>
              <button
                onClick={() => setConfigurationSubSection("cep")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "cep"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-cep"
              >
                Faixa de CEP
              </button>
            </div>

            {renderConfigurationContent()}
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
                        if (item.id === "produtos") {
                          if (index === 0) { // "Gerenciar produtos"
                            setActiveSection("produtos");
                            setExpandedMenu(null);
                          } else if (index === 1) { // "Consultar o estoque"
                            setActiveSection("estoque");
                            setExpandedMenu(null);
                          }
                        } else if (item.id === "configuracoes") {
                          if (index === 0) { // "Dados da empresa"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("dados-empresa");
                            setExpandedMenu(null);
                          } else if (index === 1) { // "Configurar WhatsApp"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("whatsapp");
                            setExpandedMenu(null);
                          } else if (index === 2) { // "Configurar SEO"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("seo");
                            setExpandedMenu(null);
                          } else if (index === 3) { // "Usuários"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("usuarios");
                            setExpandedMenu(null);
                          } else if (index === 4) { // "Faixa de Cep"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("cep");
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