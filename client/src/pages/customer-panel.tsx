import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Menu
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
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      setLocation("/");
      return;
    }
    setUser(JSON.parse(currentUser));
  }, [setLocation]);

  const queryClient = useQueryClient();

  useEffect(() => {
    // Atualizar busca quando searchQuery ou selectedCategory mudarem
    queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
  }, [searchQuery, selectedCategory, queryClient]);

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

  // Customer data hooks
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

  const { toast } = useToast();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderHomeContent = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-4 sm:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" data-testid="welcome-title">
          Olá, {user.name.split(' ')[0]}! 👋
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

      {/* All Restaurants */}
      {isLoading ? (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {[...Array(isMobile ? 6 : 12)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground" data-testid="no-restaurants-message">
            {searchQuery 
              ? "Nenhum restaurante encontrado para sua busca."
              : "Digite algo para buscar restaurantes."}
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {restaurants.map((restaurant: any) => (
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
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 text-xs ml-2 flex-shrink-0">Entregue</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800 text-xs ml-2 flex-shrink-0">A caminho</Badge>;
      case 'preparing':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-2 flex-shrink-0">Preparando</Badge>;
      case 'confirmed':
        return <Badge className="bg-orange-100 text-orange-800 text-xs ml-2 flex-shrink-0">Confirmado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 text-xs ml-2 flex-shrink-0">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs ml-2 flex-shrink-0">Pedido</Badge>;
    }
  };

  const formatOrderDate = (date: string) => {
    const orderDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (orderDate.toDateString() === today.toDateString()) {
      return `Hoje, ${orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (orderDate.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return orderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  };

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
        <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
          {customerOrders.slice(0, isMobile ? 6 : 12).map((order: any) => (
            <Card key={order.id} className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">Pedido #{order.id.slice(-6)}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                    {order.items?.length ? `${order.items.length} item(s)` : 'Itens do pedido'}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">{formatOrderDate(order.createdAt)}</span>
                <span className="font-semibold text-primary">R$ {order.total?.toFixed(2) || '0,00'}</span>
              </div>
            </Card>
          ))}
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
          <Button className="mt-4" onClick={() => setActiveTab('search')}>
            Explorar Restaurantes
          </Button>
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {customerFavorites.map((restaurant: any) => (
            <Card key={restaurant.id} className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
              <div className="flex space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Pizza className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{restaurant.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{restaurant.category || 'Categoria'}</p>
                  <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      {restaurant.rating || '4.5'}
                    </Badge>
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      <Clock className="w-3 h-3 mr-1" />
                      {restaurant.deliveryTime || '30-45'} min
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-shrink-0"
                  onClick={() => removeFromFavoritesMutation.mutate(restaurant.id)}
                  disabled={removeFromFavoritesMutation.isPending}
                >
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfileContent = () => {
    const currentUser = customerProfile || user;
    
    return (
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Meu Perfil</h2>
        
        <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
          {/* User Info */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg sm:text-xl font-bold">
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold truncate" data-testid="profile-name">
                  {currentUser?.name || 'Nome não disponível'}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground truncate" data-testid="profile-email">
                  {currentUser?.email || 'Email não disponível'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {currentUser?.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground" data-testid="profile-address">
                    {currentUser.address}
                  </span>
                </div>
              )}
              {currentUser?.phone && (
                <div className="flex items-center space-x-3">
                  <span className="text-xs sm:text-sm font-medium">Telefone:</span>
                  <span className="text-xs sm:text-sm" data-testid="profile-phone">
                    {currentUser.phone}
                  </span>
                </div>
              )}
              {currentUser?.role && (
                <div className="flex items-center space-x-3">
                  <span className="text-xs sm:text-sm font-medium">Tipo de conta:</span>
                  <Badge variant="outline" className="text-xs">
                    {currentUser.role === 'customer' ? 'Cliente' : 'Proprietário'}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2 sm:space-y-3">
            <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
              <User className="h-4 w-4 mr-2 sm:mr-3" />
              Editar Perfil
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
              <MapPin className="h-4 w-4 mr-2 sm:mr-3" />
              Gerenciar Endereços
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
              <Bell className="h-4 w-4 mr-2 sm:mr-3" />
              Notificações
            </Button>
            {!isMobile && (
              <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
                <Heart className="h-4 w-4 mr-2 sm:mr-3" />
                Configurações de Privacidade
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 hover:bg-red-50 text-sm sm:text-base" 
              onClick={() => {
                localStorage.removeItem('currentUser');
                setLocation("/");
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home": return renderHomeContent();
      case "search": return renderSearchContent();
      case "orders": return renderOrdersContent();
      case "favorites": return renderFavoritesContent();
      case "profile": return renderProfileContent();
      default: return renderHomeContent();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-card border-r border-border flex-shrink-0">
          <div className="p-6">
            <h1 className="text-xl font-bold text-primary" data-testid="logo-text-desktop">
              RestaurantePro
            </h1>
          </div>
          <nav className="mt-6">
            {bottomNavItems.map(({ icon: Icon, label, value }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  activeTab === value 
                    ? "text-primary bg-primary/10 border-r-2 border-primary" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
                data-testid={`nav-desktop-${value}`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
          <div className={`mx-auto px-4 lg:px-6 xl:px-8 ${isMobile ? 'max-w-md' : 'max-w-none'}`}>
            <div className="flex justify-between items-center h-16">
              {isMobile && (
                <h1 className="text-xl font-bold text-primary" data-testid="logo-text">
                  RestaurantePro
                </h1>
              )}
              {!isMobile && (
                <h2 className="text-xl font-semibold">
                  {bottomNavItems.find(item => item.value === activeTab)?.label || "Início"}
                </h2>
              )}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                </Button>
                {!isMobile && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 px-4 lg:px-6 xl:px-8 py-6 ${isMobile ? 'max-w-md mx-auto pb-20' : 'max-w-7xl mx-auto'}`}>
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
            <div className="max-w-md mx-auto">
              <div className="flex">
                {bottomNavItems.map(({ icon: Icon, label, value }) => (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`flex-1 py-3 px-2 text-center transition-colors ${
                      activeTab === value 
                        ? "text-primary bg-primary/5" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`nav-${value}`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}