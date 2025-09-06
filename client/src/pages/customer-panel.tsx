import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RestaurantCard } from "@/components/restaurant-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Search, 
  Pizza, 
  Sandwich, 
  Fish, 
  IceCream, 
  Coffee, 
  Leaf, 
  User, 
  MapPin, 
  Heart, 
  ShoppingBag, 
  Home, 
  Bell,
  Star,
  Clock,
  Truck,
  Menu,
  MessageSquare,
  Send,
  Phone,
  CheckCircle,
  Package,
  ChefHat,
  Eye
} from "lucide-react";

const categories = [
  { icon: Pizza, name: "Pizza", value: "pizza", color: "bg-red-100 text-red-600" },
  { icon: Sandwich, name: "Hambúrguer", value: "hamburger", color: "bg-orange-100 text-orange-600" },
  { icon: Fish, name: "Japonesa", value: "japanese", color: "bg-pink-100 text-pink-600" },
  { icon: IceCream, name: "Sobremesa", value: "dessert", color: "bg-purple-100 text-purple-600" },
  { icon: Coffee, name: "Bebidas", value: "drinks", color: "bg-amber-100 text-amber-600" },
  { icon: Leaf, name: "Saudável", value: "healthy", color: "bg-green-100 text-green-600" },
];

const bottomNavItems = [
  { icon: Home, label: "Início", value: "home" },
  { icon: Search, label: "Buscar", value: "search" },
  { icon: ShoppingBag, label: "Pedidos", value: "orders" },
  { icon: Heart, label: "Favoritos", value: "favorites" },
  { icon: User, label: "Perfil", value: "profile" },
];

export default function CustomerPanel() {
  // Todos os hooks SEMPRE declarados no início
  const [, setLocation] = useLocation();
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // WebSocket sempre ativo
  const { isConnected: wsConnected } = useWebSocket({
    userId: authUser?.id || user?.id || null,
    userType: 'customer',
    onStatusUpdate: (status, order) => {
      console.log(`Status do pedido ${order.id} atualizado para: ${status}`);
    },
    onNewMessage: (message) => {
      console.log(`Nova mensagem no pedido ${message.orderId}:`, message.message);
    }
  });

  // Todos os useEffect
  useEffect(() => {
    if (authLoading) return;
    
    if (isAuthenticated && authUser) {
      setUser(authUser);
      localStorage.setItem('currentUser', JSON.stringify(authUser));
      return;
    }
    
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
      return;
    }
    
    setLocation("/");
  }, [authLoading, isAuthenticated, authUser, setLocation]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
  }, [searchQuery, selectedCategory, queryClient]);

  // Todas as queries
  const { data: restaurants = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/restaurants"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const url = `/api/restaurants${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Falha ao carregar restaurantes');
      return response.json();
    },
    enabled: true,
  });

  const { data: customerStats } = useQuery<{
    totalOrders: number;
    favoritesCount: number;
    totalSpent: number;
    averageRating: number;
  }>({
    queryKey: ["/api/customer/stats"],
    enabled: true,
  });

  const { data: customerOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/customer/orders"],
    enabled: true,
  });

  const { data: customerFavorites = [] } = useQuery<any[]>({
    queryKey: ["/api/customer/favorites"],
    enabled: true,
  });

  const { data: customerProfile } = useQuery<any>({
    queryKey: ["/api/customer/profile"],
    enabled: true,
  });

  // Todas as mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/customer/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/profile"] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      setShowEditModal(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    },
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: (restaurantId: string) => apiRequest("/api/customer/favorites/" + restaurantId, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/stats"] });
      toast({ title: "Restaurante adicionado aos favoritos!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar favorito", variant: "destructive" });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: (restaurantId: string) => apiRequest("/api/customer/favorites/" + restaurantId, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/stats"] });
      toast({ title: "Restaurante removido dos favoritos" });
    },
    onError: () => {
      toast({ title: "Erro ao remover favorito", variant: "destructive" });
    },
  });

  // Funções auxiliares
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
  };

  // Função para buscar CEP
  const handleCepChange = async (cep: string) => {
    setEditFormData(prev => ({ ...prev, cep }));
    
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setEditFormData(prev => ({
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

  // Função para abrir modal e preencher dados atuais
  const openEditModal = () => {
    if (customerProfile) {
      setEditFormData({
        firstName: (customerProfile as any)?.firstName || '',
        lastName: (customerProfile as any)?.lastName || '',
        phone: (customerProfile as any)?.phone || '',
        address: (customerProfile as any)?.address || '',
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
      });
    }
    setShowEditModal(true);
  };

  // Função para submeter formulário
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.firstName || !editFormData.lastName) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e sobrenome são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    let finalAddress = editFormData.address;
    
    // Se preencheu endereço via CEP, montar endereço completo
    if (editFormData.cep && editFormData.rua && editFormData.numero) {
      finalAddress = `${editFormData.rua}, ${editFormData.numero} - ${editFormData.bairro}, ${editFormData.cidade} - ${editFormData.estado}, CEP: ${editFormData.cep}`;
    }

    updateProfileMutation.mutate({
      firstName: editFormData.firstName,
      lastName: editFormData.lastName,
      phone: editFormData.phone,
      address: finalAddress,
    });
  };

  // CONDIÇÕES DE RETURN SEMPRE NO FINAL
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Função para renderizar conteúdo baseado na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return renderHomeContent();
      case "search":
        return renderSearchContent();
      case "orders":
        return renderOrdersContent();
      case "favorites":
        return renderFavoritesContent();
      case "profile":
        return renderProfileContent();
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-4 sm:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" data-testid="welcome-title">
          Olá, {user.firstName || user.name?.split(' ')[0] || 'Cliente'}! 👋
        </h1>
        <p className="text-white/90 mb-4 text-sm sm:text-base" data-testid="welcome-subtitle">
          O que você gostaria de comer hoje?
        </p>
        <div className="flex bg-white rounded-lg p-1">
          <Input
            type="text"
            placeholder="Buscar restaurantes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 text-gray-800 focus:ring-0"
            data-testid="input-search"
          />
          <Button 
            onClick={() => setActiveTab("search")}
            className="bg-primary text-white hover:bg-primary/90"
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4" data-testid="categories-title">Categorias</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
          {categories.map(({ icon: Icon, name, value, color }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
              className={`p-3 sm:p-4 rounded-xl text-center transition-all hover:scale-105 ${
                selectedCategory === value ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border"
              }`}
              data-testid={`category-${value}`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <span className="text-xs sm:text-sm font-medium">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="text-center p-3 sm:p-4">
          <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold">
            {customerStats?.totalOrders || 0}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Pedidos</div>
        </Card>
        <Card className="text-center p-3 sm:p-4">
          <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold">
            {customerStats?.favoritesCount || 0}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Favoritos</div>
        </Card>
        <Card className="text-center p-3 sm:p-4">
          <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold">
            ★ {customerStats?.averageRating?.toFixed(1) || '4.8'}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Avaliação</div>
        </Card>
        {!isMobile && (
          <Card className="text-center p-3 sm:p-4">
            <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold">
              R$ {customerStats?.totalSpent?.toFixed(2) || '0,00'}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Gasto</div>
          </Card>
        )}
      </div>

      {/* Featured Restaurants */}
      <div>
        <h2 className="text-xl font-bold mb-4" data-testid="restaurants-title">Restaurantes em destaque</h2>
        {isLoading ? (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {[...Array(isMobile ? 3 : 6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {restaurants.slice(0, isMobile ? 3 : 6).map((restaurant: any) => (
              <Card key={restaurant.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Pizza className="h-8 w-8 text-primary" />
                  </div>
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
                  >
                    <h3 className="font-semibold text-base lg:text-lg group-hover:text-primary transition-colors">
                      {restaurant.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-1">{restaurant.category || 'Restaurante'}</p>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {restaurant.rating || '4.5'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {restaurant.deliveryTime || '25-35'} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Truck className="w-3 h-3 mr-1" />
                        R$ {restaurant.deliveryFee || '5,99'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-shrink-0 p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isFav = customerFavorites.some((fav: any) => fav.id === restaurant.id);
                        if (isFav) {
                          removeFromFavoritesMutation.mutate(restaurant.id);
                        } else {
                          addToFavoritesMutation.mutate(restaurant.id);
                        }
                      }}
                      disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
                    >
                      <Heart className={`h-4 w-4 ${
                        customerFavorites.some((fav: any) => fav.id === restaurant.id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-muted-foreground'
                      }`} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSearchContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Buscar Restaurantes</h2>
        <form onSubmit={handleSearch} className="flex bg-card rounded-lg border">
          <Input
            type="text"
            placeholder="Digite o nome do restaurante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 focus:ring-0"
            data-testid="input-search-page"
          />
          <Button type="submit" className="m-1">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  const renderOrdersContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Meus Pedidos</h2>
      {customerOrders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
          <Button className="mt-4" onClick={() => setActiveTab('home')}>
            Explorar Restaurantes
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground">Seus pedidos aparecerão aqui.</p>
        </div>
      )}
    </div>
  );

  const renderFavoritesContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Meus Favoritos</h2>
      {customerFavorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Você ainda não tem restaurantes favoritos.</p>
          <Button className="mt-4" onClick={() => setActiveTab('home')}>
            Descobrir Restaurantes
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground">Seus restaurantes favoritos aparecerão aqui.</p>
        </div>
      )}
    </div>
  );

  const renderProfileContent = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">Meu Perfil</h2>
      
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {customerProfile?.firstName} {customerProfile?.lastName}
            </h3>
            <p className="text-muted-foreground">{customerProfile?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Telefone</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {customerProfile?.phone || 'Não informado'}
            </p>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Endereço</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {customerProfile?.address || 'Não informado'}
            </p>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <Button onClick={openEditModal} className="flex-1">
            Editar Perfil
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              localStorage.removeItem('currentUser');
              setLocation('/');
            }}
            className="flex-1"
          >
            Sair
          </Button>
        </div>
      </Card>

      {/* Modal de edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                value={editFormData.address}
                onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={updateProfileMutation.isPending} className="flex-1">
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet Layout */}
      {!isMobile ? (
        <div className="max-w-6xl mx-auto p-4">
          {/* Navigation Tabs */}
          <div className="flex space-x-8 mb-6 border-b">
            {bottomNavItems.map(({ icon: Icon, label, value }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`flex items-center space-x-2 pb-3 transition-colors ${
                  activeTab === value
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          
          {renderContent()}
        </div>
      ) : (
        /* Mobile Layout */
        <div className="flex flex-col min-h-screen">
          <div className="flex-1 p-4 pb-20">
            {renderContent()}
          </div>
          
          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
            <div className="flex justify-around items-center py-2">
              {bottomNavItems.map(({ icon: Icon, label, value }) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`flex flex-col items-center space-y-1 py-2 px-4 transition-colors ${
                    activeTab === value
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`nav-${value}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}