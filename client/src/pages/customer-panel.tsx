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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-4 sm:p-6 lg:p-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" data-testid="welcome-title">
              Olá, {user.firstName || user.name?.split(' ')[0] || 'Cliente'}! 👋
            </h1>
            <p className="text-white/90 mb-4 text-sm sm:text-base" data-testid="welcome-subtitle">
              O que você gostaria de comer hoje?
            </p>
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
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}