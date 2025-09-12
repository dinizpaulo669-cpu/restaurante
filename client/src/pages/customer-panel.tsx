import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/use-websocket";
import { usePWA } from "@/hooks/use-pwa";
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

// Componente de Chat para Pedidos
const OrderChatComponent = ({ orderId }: { orderId: string }) => {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/messages`],
    enabled: !!orderId,
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => apiRequest("POST", `/api/orders/${orderId}/messages`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/messages`] });
      setNewMessage("");
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada ao restaurante"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    }
  });
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="space-y-4">
      <ScrollArea className="h-64 pr-4">
        <div className="space-y-3">
          {!Array.isArray(messages) || messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              Nenhuma mensagem ainda
            </p>
          ) : (
            messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderType === "customer" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    message.senderType === "customer"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatDate(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <Separator />
      
      <div className="flex space-x-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <Button
          size="sm"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
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
  Eye,
  Filter,
  Table,
  X,
  Calendar,
  Download
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
  const { canInstall, installPWA, isInstalled } = usePWA();
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // WebSocket sempre ativo
  const { isConnected: wsConnected } = useWebSocket({
    userId: (authUser as any)?.id || (user as any)?.id || null,
    userType: 'customer',
    onStatusUpdate: (status, order) => {
      console.log(`Status do pedido ${order?.id || 'N/A'} atualizado para: ${status}`);
      queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
      // Adicionar notificação
      const newNotification = {
        id: Date.now(),
        type: 'status_update',
        title: 'Status do pedido atualizado',
        message: `Seu pedido agora está ${status === 'delivered' ? 'entregue' : status === 'preparing' ? 'sendo preparado' : status}`,
        timestamp: new Date(),
        read: false,
        orderId: order?.id
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast({
        title: "Status do pedido atualizado",
        description: newNotification.message,
      });
    },
    onNewMessage: (message) => {
      console.log(`Nova mensagem no pedido ${message?.orderId}:`, message?.message);
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${message?.orderId}/messages`] });
      // Adicionar notificação de mensagem
      const newNotification = {
        id: Date.now(),
        type: 'new_message',
        title: 'Nova mensagem',
        message: 'Você recebeu uma nova mensagem do restaurante',
        timestamp: new Date(),
        read: false,
        orderId: message?.orderId
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast({
        title: "Nova mensagem",
        description: "Você recebeu uma nova mensagem do restaurante",
      });
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

  // Todas as queries
  const { data: restaurants = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/restaurants", { search: searchQuery, category: selectedCategory }],
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

  // Funções para notificações
  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Funções auxiliares para pedidos
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pendente",
      confirmed: "Confirmado", 
      preparing: "Preparando",
      ready: "Pronto",
      out_for_delivery: "A caminho",
      delivered: "Entregue",
      cancelled: "Cancelado"
    };
    return labels[status] || status;
  };
  
  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      ready: "bg-purple-100 text-purple-800",
      out_for_delivery: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };
  
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
      <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-6 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold mb-3" data-testid="welcome-title">
          Olá, {user.firstName || user.name?.split(' ')[0] || 'Cliente'}! 👋
        </h1>
        <p className="text-white/90 mb-5 text-base sm:text-base" data-testid="welcome-subtitle">
          O que você gostaria de comer hoje?
        </p>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
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
          
          {/* Sistema de Notificações */}
          <div className="relative ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-white text-gray-800 border-gray-300"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-background border rounded-lg shadow-lg z-50" data-testid="notifications-panel">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-medium">Notificações</h3>
                  <div className="flex space-x-2">
                    {notifications.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={clearAllNotifications}>
                        Limpar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setShowNotifications(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ScrollArea className="max-h-96">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                            notification.read ? 'bg-muted/50' : 'bg-primary/5 border border-primary/20'
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                          data-testid={`notification-${notification.id}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.timestamp.toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl sm:text-xl lg:text-2xl font-bold mb-5" data-testid="categories-title">Categorias</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-4">
          {categories.map(({ icon: Icon, name, value, color }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
              className={`p-4 sm:p-4 rounded-xl text-center transition-all hover:scale-105 ${
                selectedCategory === value ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border"
              }`}
              data-testid={`category-${value}`}
            >
              <div className={`w-12 h-12 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full ${color} flex items-center justify-center mx-auto mb-3`}>
                <Icon className="h-6 w-6 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <span className="text-sm sm:text-sm font-medium">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
              </div>
              <div className="text-sm font-medium text-muted-foreground">Bem-vindo de volta!</div>
              <div className="text-xs text-muted-foreground mt-1">
                Descubra novos sabores hoje
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Restaurants */}
      <div>
        <h2 className="text-xl font-bold mb-5" data-testid="restaurants-title">Restaurantes em destaque</h2>
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
                  <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Pizza className="h-10 w-10 text-primary" />
                  </div>
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
                  >
                    <h3 className="font-semibold text-lg lg:text-lg group-hover:text-primary transition-colors">
                      {restaurant.name}
                    </h3>
                    <p className="text-muted-foreground text-base mb-2">{restaurant.category || 'Restaurante'}</p>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Badge variant="secondary" className="text-sm py-1">
                        <Star className="w-4 h-4 mr-1" />
                        {restaurant.rating || '4.5'}
                      </Badge>
                      <Badge variant="outline" className="text-sm py-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {restaurant.deliveryTime || '25-35'} min
                      </Badge>
                      <Badge variant="outline" className="text-sm py-1">
                        <Truck className="w-4 h-4 mr-1" />
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

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Categorias</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map(({ icon: Icon, name, value, color }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
              className={`p-3 rounded-xl text-center transition-all hover:scale-105 ${
                selectedCategory === value ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border"
              }`}
              data-testid={`search-category-${value}`}
            >
              <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          {searchQuery || selectedCategory 
            ? `Resultados da busca${searchQuery ? ` por "${searchQuery}"` : ''}${selectedCategory ? ` na categoria "${categories.find(c => c.value === selectedCategory)?.name}"` : ''}`
            : "Todos os restaurantes"}
        </h3>
        
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
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
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory 
                ? "Nenhum restaurante encontrado para sua busca."
                : "Nenhum restaurante disponível no momento."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant: any) => (
              <Card key={restaurant.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex space-x-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Pizza className="h-10 w-10 text-primary" />
                  </div>
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
                  >
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
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
                        {restaurant.deliveryTime || 30} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Truck className="w-3 h-3 mr-1" />
                        R$ {restaurant.deliveryFee || '0,00'}
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
          {customerOrders.map((order: any) => (
            <Card key={order.id} className="p-4" data-testid={`customer-order-${order.id}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-lg flex items-center space-x-2">
                      {order.orderType === 'table' && <Table className="w-4 h-4" />}
                      {order.orderType === 'delivery' && <Truck className="w-4 h-4" />}
                      <span>Pedido #{order.orderNumber}</span>
                    </h4>
                    <Badge className={getStatusBadgeColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {' '}
                    {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="font-medium text-sm mt-1">
                    Restaurante: {order.restaurant?.name || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">R$ {order.total}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.orderType === "delivery" ? "Entrega" : order.orderType === "table" ? "Mesa" : "Retirada"}
                  </p>
                </div>
              </div>
              
              {order.notes && (
                <div className="mb-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Observações:</strong> {order.notes}
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedOrderId(order.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Pedido #{order.orderNumber}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Itens do Pedido</h4>
                          <div className="space-y-2">
                            {order.items?.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.product?.name || 'Item'}</span>
                                <span>R$ {item.totalPrice}</span>
                              </div>
                            )) || <p className="text-muted-foreground">Itens não disponíveis</p>}
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>R$ {order.total}</span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedOrderId(order.id)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Chat - Pedido #{order.orderNumber}</DialogTitle>
                      </DialogHeader>
                      <OrderChatComponent orderId={order.id} />
                    </DialogContent>
                  </Dialog>
                </div>
                
                {order.estimatedDeliveryTime && (
                  <div className="text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Previsão: {new Date(order.estimatedDeliveryTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
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

        <div className="space-y-3 mt-6">
          <div className="flex space-x-4">
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

          {/* Botão de Instalação PWA */}
          {canInstall && !isInstalled && (
            <Button 
              onClick={async () => {
                const success = await installPWA();
                if (success) {
                  toast({
                    title: "App Instalado!",
                    description: "Agora você pode acessar o RestaurantePro diretamente da sua tela inicial.",
                  });
                }
              }}
              variant="secondary"
              className="w-full bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-primary/20 text-primary font-semibold"
              data-testid="button-install-pwa"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar App
            </Button>
          )}
          
          {/* Indicador de App Instalado */}
          {isInstalled && (
            <div className="flex items-center justify-center py-2 px-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">App instalado com sucesso!</span>
            </div>
          )}
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
          <div className="flex-1 p-5 pb-24">
            {renderContent()}
          </div>
          
          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg">
            <div className="flex justify-around items-center py-3">
              {bottomNavItems.map(({ icon: Icon, label, value }) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`flex flex-col items-center space-y-2 py-3 px-3 min-h-[60px] transition-colors ${
                    activeTab === value
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`nav-${value}`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}