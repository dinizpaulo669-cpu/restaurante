import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  MapPin, 
  Clock, 
  Phone,
  Star,
  Truck,
  Home,
  ArrowLeft,
  Tag,
  X,
  MessageCircle,
  Receipt,
  Send,
  CheckCircle2,
  Heart
} from "lucide-react";
import { CouponsSection } from "@/components/coupons-section";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Customer {
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export default function Menu() {
  const { restaurantId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });
  
  // Estados para cupom
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Detectar se é pedido de mesa através da URL
  const urlParams = new URLSearchParams(window.location.search);
  const tableQrCode = urlParams.get('table');
  const isTableOrder = !!tableQrCode;
  const [tableData, setTableData] = useState<any>(null);

  // Estados para funcionalidade da mesa
  const [showTableOrders, setShowTableOrders] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Estados para avaliação
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  // Buscar dados do restaurante
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !!restaurantId,
  });

  // Buscar produtos do restaurante (filtrados por tipo de pedido)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/products`, { orderType: isTableOrder ? 'table' : 'delivery' }],
    enabled: !!restaurantId,
  });

  // Buscar categorias do restaurante
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
    enabled: !!restaurantId,
  });

  // Buscar perfil do cliente se autenticado
  const { data: customerProfile } = useQuery({
    queryKey: ["/api/customer/profile"],
    enabled: isAuthenticated,
  });

  // Buscar dados da mesa se for pedido de mesa
  const { data: tableInfo } = useQuery({
    queryKey: [`/api/tables/qr/${tableQrCode}`],
    enabled: !!tableQrCode,
  }) as { data: { id: string; number: string; name: string; qrCode: string } | undefined };

  // Buscar áreas de atendimento do restaurante
  const { data: serviceAreas = [] } = useQuery<any[]>({
    queryKey: [`/api/service-areas/${restaurantId}`],
    enabled: !!restaurantId && !isTableOrder,
    retry: false,
  });

  // Buscar pedidos da mesa se for pedido de mesa
  const { data: tableOrders = [], isLoading: tableOrdersLoading, refetch: refetchTableOrders } = useQuery({
    queryKey: [`/api/tables/${tableInfo?.id}/orders`],
    enabled: isTableOrder && !!tableInfo?.id,
    refetchInterval: 30000, // Backup polling a cada 30 segundos (principalmente WebSocket)
  });

  // Buscar mensagens do chat do pedido selecionado
  const { data: chatMessages = [], isLoading: chatLoading } = useQuery({
    queryKey: [`/api/orders/${selectedOrderForChat}/messages`],
    enabled: !!selectedOrderForChat,
    refetchInterval: 10000, // Backup polling para mensagens
  });

  // Buscar favoritos do cliente se autenticado
  const { data: customerFavorites = [] } = useQuery({
    queryKey: ["/api/customer/favorites"],
    enabled: isAuthenticated,
  });

  // Verificar se o restaurante atual é favorito
  const isRestaurantFavorite = restaurantId && customerFavorites.some((fav: any) => fav.id === restaurantId);

  // Mutations para favoritos
  const addToFavoritesMutation = useMutation({
    mutationFn: (restaurantId: string) => apiRequest("POST", "/api/customer/favorites/" + restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/favorites"] });
      toast({ title: "Restaurante adicionado aos favoritos!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar favorito", variant: "destructive" });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: (restaurantId: string) => apiRequest("DELETE", "/api/customer/favorites/" + restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/favorites"] });
      toast({ title: "Restaurante removido dos favoritos" });
    },
    onError: () => {
      toast({ title: "Erro ao remover favorito", variant: "destructive" });
    },
  });

  // Buscar avaliação do usuário para este restaurante
  const { data: userReview } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/reviews/check`],
    enabled: !!restaurantId && isAuthenticated,
  });

  // Mutation para criar/atualizar avaliação
  const createReviewMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) => 
      apiRequest("POST", `/api/restaurants/${restaurantId}/reviews`, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/reviews/check`] });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}`] });
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment("");
      toast({ 
        title: "Avaliação enviada!", 
        description: "Obrigado por avaliar este restaurante."
      });
    },
    onError: () => {
      toast({ 
        title: "Erro ao enviar avaliação", 
        variant: "destructive"
      });
    },
  });

  // WebSocket para atualizações em tempo real
  const { sendMessage: sendWSMessage, connectionStatus } = useWebSocket({
    orderId: selectedOrderForChat || undefined,
    userId: tableInfo?.id ? `table-${tableInfo.id}` : undefined,
    userType: "customer",
    onNewMessage: (message: any) => {
      // Invalidar cache de mensagens quando receber nova mensagem
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${message.orderId}/messages`] });
    },
    onStatusUpdate: (update: any) => {
      // Invalidar cache de pedidos da mesa quando status mudar
      if (tableInfo?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/tables/${tableInfo.id}/orders`] });
      }
    }
  });

  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
          image: product.imageUrl
        }];
      }
    });

    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho!`,
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const extractNeighborhoodFromAddress = (address: string): string | null => {
    if (!address) return null;
    
    // Tentar encontrar bairro em endereços típicos brasileiros
    // Padrões comuns: "Rua X, 123, Bairro Y, Cidade" ou "Bairro X, Cidade"
    const patterns = [
      /,\s*([^,]+?)\s*,\s*[^,]+\s*-\s*[A-Z]{2}/, // Pattern: , Bairro, Cidade - Estado
      /,\s*([^,]+?)\s*,/, // Pattern: , Bairro,
      /^([^,]+?)\s*,/, // Pattern: Bairro,
    ];
    
    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        return match[1].trim();
      }
    }
    
    return null;
  };

  const getDeliveryFee = () => {
    if (isTableOrder) return 0;
    
    // Para pedidos de entrega, tentar usar taxa específica por bairro
    const customerAddress = (customerProfile as any)?.address || '';
    
    if (customerAddress && serviceAreas.length > 0) {
      const neighborhood = extractNeighborhoodFromAddress(customerAddress);
      
      if (neighborhood) {
        // Buscar área específica para o bairro (case insensitive)
        const area = serviceAreas.find(area => 
          area.isActive && 
          area.neighborhood.toLowerCase() === neighborhood.toLowerCase()
        );
        
        if (area) {
          return parseFloat(area.deliveryFee || "0");
        }
      }
    }
    
    // Se não encontrou área específica, usar taxa padrão do restaurante
    return parseFloat((restaurant as any)?.deliveryFee || "0");
  };

  // Função para aplicar cupom
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Digite um código de cupom");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: couponCode.trim().toUpperCase(),
          orderValue: getTotalPrice()
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponError("");
        toast({
          title: "Cupom aplicado!",
          description: `Desconto de ${data.coupon.discountType === 'percentage' 
            ? `${data.coupon.discountValue}%` 
            : `R$ ${parseFloat(data.coupon.discountValue).toFixed(2)}`} aplicado`,
        });
      } else {
        setCouponError(data.message || "Cupom inválido");
      }
    } catch (error) {
      setCouponError("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  // Função para remover cupom
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast({
      title: "Cupom removido",
      description: "O desconto foi removido do pedido",
    });
  };

  // Função para calcular desconto do cupom
  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = getTotalPrice();
    if (appliedCoupon.discountType === 'percentage') {
      return (subtotal * parseFloat(appliedCoupon.discountValue)) / 100;
    } else {
      return parseFloat(appliedCoupon.discountValue);
    }
  };

  // Função para calcular total final com desconto
  const getFinalTotal = () => {
    const subtotal = getTotalPrice();
    const discount = getCouponDiscount();
    const deliveryFee = getDeliveryFee();
    return Math.max(0, subtotal - discount + deliveryFee);
  };

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: ({ orderId, message }: { orderId: string; message: string }) => 
      apiRequest("POST", `/api/orders/${orderId}/messages`, { 
        message, 
        senderType: "customer",
        tableId: tableInfo?.id, // Incluir ID da mesa para identificação
        tableName: `Mesa ${tableInfo?.number}` // Nome da mesa para contexto
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${selectedOrderForChat}/messages`] });
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

  // Função para enviar mensagem
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedOrderForChat) return;
    
    sendMessageMutation.mutate({
      orderId: selectedOrderForChat,
      message: newMessage.trim()
    });
  };

  // Auto scroll para mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleOrder = async () => {
    // Para pedidos de mesa, permitir sem autenticação completa
    if (!isTableOrder) {
      // Validar se o cliente tem perfil completo (apenas para delivery)
      if (!customerProfile) {
        toast({
          title: "Perfil não encontrado",
          description: "É necessário ter um perfil cadastrado para fazer pedidos.",
          variant: "destructive",
        });
        return;
      }

      const customerName = (customerProfile as any)?.firstName && (customerProfile as any)?.lastName 
        ? `${(customerProfile as any).firstName} ${(customerProfile as any).lastName}`
        : (customerProfile as any)?.email;

      if (!customerName || !(customerProfile as any)?.email) {
        toast({
          title: "Dados incompletos",
          description: "Complete seu perfil para fazer pedidos. Acesse 'Meu Perfil' no menu.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Para mesas, validar apenas se o nome foi fornecido
      if (!customer.name || customer.name.trim() === "") {
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe seu nome para o pedido da mesa.",
          variant: "destructive",
        });
        return;
      }
    }

    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de fazer o pedido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const deliveryFee = getDeliveryFee();
      const couponDiscount = getCouponDiscount();
      
      // Definir dados do cliente baseado no tipo de pedido
      const customerName = isTableOrder 
        ? customer.name 
        : ((customerProfile as any)?.firstName && (customerProfile as any)?.lastName 
          ? `${(customerProfile as any).firstName} ${(customerProfile as any).lastName}`
          : (customerProfile as any)?.email);
      
      const customerPhone = isTableOrder 
        ? customer.phone || '' 
        : (customerProfile as any)?.phone || '';
      
      const customerAddress = isTableOrder 
        ? `Mesa ${tableInfo?.number || 'N/A'}` 
        : (customerProfile as any)?.address || 'Endereço não informado';
      
      const orderData = {
        restaurantId,
        customerName,
        customerPhone,
        customerAddress,
        notes: customer.notes,
        orderType: isTableOrder ? 'table' : 'delivery',
        tableId: isTableOrder ? tableInfo?.id : null,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        subtotal: getTotalPrice(),
        deliveryFee: deliveryFee,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount,
        total: getFinalTotal()
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pedido');
      }

      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi enviado com sucesso. Em breve entraremos em contato!",
      });

      // Limpar carrinho, observações e cupom
      setCart([]);
      setCustomer({ name: "", phone: "", address: "", notes: "" });
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError("");
      setShowCheckout(false);
      setShowCart(false);

    } catch (error) {
      toast({
        title: "Erro ao fazer pedido",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  if (restaurantLoading) {
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
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Restaurante não encontrado</h2>
            <p className="text-muted-foreground">O restaurante que você está procurando não existe.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Restaurante - Design Profissional */}
      <div className="bg-gradient-to-br from-primary/8 via-primary/4 to-background shadow-lg border-b">
        {/* Banner do restaurante */}
        {(restaurant as any)?.bannerUrl && (
          <div className="relative h-48 sm:h-64 lg:h-80 overflow-hidden">
            <img 
              src={(restaurant as any).bannerUrl} 
              alt="Banner do restaurante"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between py-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (isAuthenticated) {
                  setLocation('/customer-panel');
                } else {
                  setLocation('/');
                }
              }}
              className="flex items-center gap-2 hover:bg-primary/10 transition-all duration-200"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">
                {isAuthenticated ? 'Voltar ao Painel' : 'Voltar ao Início'}
              </span>
            </Button>

            {/* Botão do Carrinho */}
            <Button 
              onClick={() => setShowCart(!showCart)}
              className="relative bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-medium">Carrinho</span>
              {getTotalItems() > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center text-xs font-bold animate-pulse"
                >
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>

          {/* Restaurant Header */}
          <div className="pb-8 pt-4">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
              {/* Main Restaurant Info */}
              <div className="xl:col-span-3 space-y-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    {(restaurant as any)?.logoUrl && (
                      <img 
                        src={(restaurant as any).logoUrl} 
                        alt="Logo do restaurante"
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg bg-white shadow-md"
                      />
                    )}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight">
                      {(restaurant as any)?.name}
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-3xl">
                    {(restaurant as any)?.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-full border border-yellow-200">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-yellow-700 text-lg">{(restaurant as any)?.rating}</span>
                    <span className="text-yellow-600 text-sm">avaliação</span>
                  </div>
                  <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
                    {(restaurant as any)?.category}
                  </Badge>
                  {isTableOrder && (
                    <Badge variant="outline" className="px-4 py-2 text-sm font-semibold border-green-300 text-green-700 bg-green-50">
                      Mesa {tableInfo?.number || 'N/A'}
                    </Badge>
                  )}
                  {/* Botão de Favoritos */}
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isRestaurantFavorite) {
                          removeFromFavoritesMutation.mutate(restaurantId!);
                        } else {
                          addToFavoritesMutation.mutate(restaurantId!);
                        }
                      }}
                      disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
                      className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${
                        isRestaurantFavorite 
                          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                      data-testid="button-favorite-restaurant"
                    >
                      <Heart className={`w-4 h-4 ${isRestaurantFavorite ? 'fill-current text-red-500' : ''}`} />
                      <span className="text-sm font-medium">
                        {isRestaurantFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                      </span>
                    </Button>
                  )}
                  
                  {/* Botão de Avaliação */}
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (userReview) {
                          setReviewRating(userReview.rating);
                          setReviewComment(userReview.comment || "");
                        }
                        setShowReviewModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 transition-all duration-200"
                      data-testid="button-review-restaurant"
                    >
                      <Star className={`w-4 h-4 ${userReview ? 'fill-current text-yellow-500' : ''}`} />
                      <span className="text-sm font-medium">
                        {userReview ? 'Editar Avaliação' : 'Avaliar Restaurante'}
                      </span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Contact & Info Card */}
              <div className="xl:col-span-2">
                <Card className="bg-white/70 backdrop-blur-sm border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-primary text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-900 block">{(restaurant as any)?.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">{(restaurant as any)?.phone}</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        {(restaurant as any)?.openingTime} - {(restaurant as any)?.closingTime}
                      </span>
                    </div>

                    {!isTableOrder && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Truck className="w-5 h-5 text-green-600" />
                        <div>
                          <span className="text-sm font-semibold text-green-700 block">Taxa de Entrega</span>
                          <span className="text-lg font-bold text-green-800">
                            R$ {getDeliveryFee().toFixed(2)}
                          </span>
                          {serviceAreas.length > 0 && (customerProfile as any)?.address && (
                            <span className="text-xs text-green-600 block mt-1">
                              {(() => {
                                const neighborhood = extractNeighborhoodFromAddress((customerProfile as any).address || '');
                                const area = serviceAreas.find(area => 
                                  area.isActive && 
                                  area.neighborhood.toLowerCase() === neighborhood?.toLowerCase()
                                );
                                return area ? `Para ${neighborhood}` : 'Taxa padrão';
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {isTableOrder && (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <Home className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">
                          Pedido para consumir no local
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Cupons em Destaque */}
      {restaurantId && <CouponsSection restaurantId={restaurantId} />}

      {/* Seção de Pedidos e Chat da Mesa */}
      {isTableOrder && tableInfo && (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Mesa {tableInfo.number}
              </h2>
              <p className="text-gray-600">
                Acompanhe seus pedidos e converse com o restaurante
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Card de Pedidos Ativos */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Seus Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {tableOrdersLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
                    </div>
                  ) : tableOrders.length === 0 ? (
                    <div className="p-6 text-center">
                      <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {(tableOrders as any[]).map((order: any) => (
                        <div key={order.id} className="p-4 border-b last:border-b-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-sm font-medium">Pedido #{order.orderNumber}</span>
                              <div className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={`text-xs ${
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                  order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.status === 'pending' ? 'Pendente' :
                                 order.status === 'preparing' ? 'Preparando' :
                                 order.status === 'ready' ? 'Pronto' :
                                 order.status === 'delivered' ? 'Entregue' : order.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrderForChat(order.id);
                                }}
                                data-testid={`button-chat-order-${order.id}`}
                              >
                                <MessageCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {order.items?.map((item: any) => (
                              <div key={item.id} className="text-xs text-muted-foreground flex justify-between">
                                <span>{item.quantity}x {item.product?.name}</span>
                                <span>R$ {parseFloat(item.totalPrice || "0").toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t text-sm font-medium">
                            Total: R$ {parseFloat(order.total || "0").toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de Chat Rápido */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Chat com o Restaurante
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {tableOrders.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Faça seu primeiro pedido para iniciar uma conversa
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Clique no ícone de chat ao lado de cada pedido para conversar sobre ele
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cada pedido tem seu próprio chat com o restaurante
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline"
                onClick={() => setShowTableOrders(!showTableOrders)}
                data-testid="button-toggle-orders"
              >
                <Receipt className="w-4 h-4 mr-2" />
                {showTableOrders ? 'Ocultar' : 'Ver'} Histórico
              </Button>
              
              <Button 
                variant="secondary"
                onClick={() => refetchTableOrders()}
                data-testid="button-refresh-orders"
              >
                Atualizar Pedidos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Chat */}
      {selectedOrderForChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
            <CardHeader className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat - Pedido #{(tableOrders as any[]).find(o => o.id === selectedOrderForChat)?.orderNumber}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    setSelectedOrderForChat(null);
                  }}
                  data-testid="button-close-chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {(chatMessages as any[]).length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma mensagem ainda. Inicie a conversa!
                    </p>
                  </div>
                ) : (
                  (chatMessages as any[]).map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.senderType === 'customer'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <div
                          className={`text-xs mt-1 ${
                            message.senderType === 'customer'
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input de mensagem */}
              <div className="flex-shrink-0 p-4 bg-white border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Principal - Layout Profissional */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-primary mb-4 text-center lg:text-left">
            Cardápio
          </h2>
          <p className="text-lg text-muted-foreground text-center lg:text-left max-w-2xl">
            Descubra nossos pratos especiais e sabores únicos preparados com ingredientes frescos e muito carinho.
          </p>
        </div>
        
        {productsLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando delícias...</p>
            </div>
          </div>
        ) : (products as any[]).length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Cardápio em Preparação</h3>
              <p className="text-muted-foreground leading-relaxed">
                Este restaurante está preparando seu cardápio especial. Em breve, você poderá saborear pratos incríveis!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-16">
            {(categories as any[]).map((category: any) => {
              const categoryProducts = (products as any[]).filter((product: any) => product.categoryId === category.id);
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} className="scroll-mt-24" id={`category-${category.id}`}>
                  {/* Category Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-3xl sm:text-4xl font-bold text-primary">{category.name}</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                    </div>
                    {category.description && (
                      <p className="text-muted-foreground text-lg">{category.description}</p>
                    )}
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                    {categoryProducts.map((product: any) => (
                      <Card key={product.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-white via-white to-primary/[0.02]">
                        {/* Product Image */}
                        <div className="relative overflow-hidden">
                          {product.imageUrl ? (
                            <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10">
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                              <Tag className="w-16 h-16 text-primary/60" />
                            </div>
                          )}
                          {/* Price Badge */}
                          <div className="absolute top-4 right-4">
                            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg border border-green-100">
                              <span className="text-lg font-bold text-green-600">
                                R$ {parseFloat(product.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Content */}
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                            {product.description && (
                              <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                            onClick={() => addToCart(product)}
                            data-testid={`button-add-${product.id}`}
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Adicionar ao Carrinho
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Produtos sem categoria */}
            {(() => {
              const uncategorizedProducts = (products as any[]).filter((product: any) => !product.categoryId);
              if (uncategorizedProducts.length === 0) return null;

              return (
                <div className="scroll-mt-24">
                  {/* Category Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-3xl sm:text-4xl font-bold text-primary">Outros Produtos</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                    {uncategorizedProducts.map((product: any) => (
                      <Card key={product.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-white via-white to-primary/[0.02]">
                        {/* Product Image */}
                        <div className="relative overflow-hidden">
                          {product.imageUrl ? (
                            <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10">
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                              <Tag className="w-16 h-16 text-primary/60" />
                            </div>
                          )}
                          {/* Price Badge */}
                          <div className="absolute top-4 right-4">
                            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg border border-green-100">
                              <span className="text-lg font-bold text-green-600">
                                R$ {parseFloat(product.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Content */}
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                            {product.description && (
                              <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                            onClick={() => addToCart(product)}
                            data-testid={`button-add-${product.id}`}
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Adicionar ao Carrinho
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Sidebar do Carrinho com Chat e Lista de Produtos */}
      {showCart && (
        <div className="fixed inset-0 z-50 lg:z-auto lg:w-full lg:max-w-6xl lg:relative lg:inset-auto">
          <div className="lg:sticky lg:top-6 h-full lg:h-auto">
            <div className="w-full lg:relative fixed lg:static inset-0 lg:inset-auto z-50 lg:z-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full lg:h-auto">
                
                {/* Seção do Carrinho */}
                <Card className="sticky top-6 lg:max-h-[calc(100vh-3rem)] overflow-y-auto min-h-screen lg:min-h-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Carrinho</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowCart(false)}
                    >
                      ✕
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Seu carrinho está vazio
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>R$ {getTotalPrice().toFixed(2)}</span>
                        </div>
                        {!isTableOrder && (
                          <div className="flex justify-between">
                            <span>Taxa de entrega:</span>
                            <span>R$ {getDeliveryFee().toFixed(2)}</span>
                          </div>
                        )}
                        {isTableOrder && (
                          <div className="flex justify-between text-green-600">
                            <span>Consumo no local:</span>
                            <span>Sem taxa de entrega</span>
                          </div>
                        )}
                        {appliedCoupon && (
                          <div className="flex justify-between text-green-600">
                            <span>Desconto ({appliedCoupon.code}):</span>
                            <span>-R$ {getCouponDiscount().toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>R$ {getFinalTotal().toFixed(2)}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-4"
                        onClick={() => setShowCheckout(true)}
                        data-testid="button-checkout"
                      >
                        Finalizar Pedido
                      </Button>
                    </div>
                  )}
                </CardContent>
                </Card>
                
                {/* Seção do Chat */}
                <Card className="sticky top-6 lg:max-h-[calc(100vh-3rem)] overflow-y-auto min-h-screen lg:min-h-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Chat com Vendedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full">
                    {/* Área de Mensagens */}
                    <div className="flex-1 space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {selectedOrderForChat ? (
                        chatLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
                          </div>
                        ) : chatMessages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Nenhuma mensagem ainda. Inicie a conversa sobre este pedido!
                            </p>
                          </div>
                        ) : (
                          <>
                            {(chatMessages as any[]).map((message: any) => (
                              <div
                                key={message.id}
                                className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] p-3 rounded-lg ${
                                    message.senderType === 'customer'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200 text-gray-800'
                                  }`}
                                >
                                  <p className="text-sm">{message.message}</p>
                                  <span className="text-xs opacity-75">
                                    {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </>
                        )
                      ) : (
                        <div className="text-center py-8">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm text-muted-foreground">Selecione um pedido para iniciar o chat</p>
                          <p className="text-xs text-muted-foreground mt-1">Clique no ícone de chat em um pedido</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Campo de Envio de Mensagem */}
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={selectedOrderForChat ? "Digite sua mensagem..." : "Selecione um pedido primeiro"}
                        className="flex-1"
                        disabled={!selectedOrderForChat}
                        data-testid="input-chat-message"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || !selectedOrderForChat || sendMessageMutation.isPending}
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Seção da Lista de Produtos dos Pedidos */}
                <Card className="sticky top-6 lg:max-h-[calc(100vh-3rem)] overflow-y-auto min-h-screen lg:min-h-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Seus Pedidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isTableOrder && tableOrders.length > 0 ? (
                      <div className="space-y-4">
                        {(tableOrders as any[]).map((order: any) => (
                          <div key={order.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-sm font-medium">Pedido #{order.orderNumber}</span>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`text-xs ${
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                    order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {order.status === 'pending' ? 'Pendente' :
                                   order.status === 'preparing' ? 'Preparando' :
                                   order.status === 'ready' ? 'Pronto' :
                                   order.status === 'delivered' ? 'Entregue' : order.status}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedOrderForChat(order.id);
                                  }}
                                  data-testid={`button-chat-order-${order.id}`}
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Produtos:</p>
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="text-xs flex justify-between">
                                  <span>{item.quantity}x {item.product?.name}</span>
                                  <span className="font-medium">R$ {parseFloat(item.totalPrice || "0").toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="border-t pt-1 mt-2">
                                <div className="text-xs flex justify-between font-medium">
                                  <span>Total:</span>
                                  <span>R$ {parseFloat(order.totalPrice || "0").toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
                        <p className="text-xs text-muted-foreground mt-1">Seus pedidos aparecerão aqui</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checkout */}
        {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-md my-4 sm:my-8">
            <Card className="w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Finalizar Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dados do cliente */}
              {isTableOrder ? (
                // Formulário para pedidos de mesa (sem login)
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium text-sm text-blue-800 mb-2">
                    📍 Pedido da Mesa {tableInfo?.number || 'N/A'}
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome *</label>
                    <Input
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Seu nome"
                      data-testid="input-customer-name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone (opcional)</label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      data-testid="input-customer-phone"
                    />
                  </div>

                  <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    ℹ️ Seu pedido será entregue diretamente na mesa {tableInfo?.number || 'N/A'}
                  </div>
                </div>
              ) : customerProfile ? (
                // Dados do cliente autenticado (delivery)
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Dados do Cliente</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome</label>
                    <div className="p-2 bg-background rounded border text-sm">
                      {(customerProfile as any)?.firstName && (customerProfile as any)?.lastName 
                        ? `${(customerProfile as any).firstName} ${(customerProfile as any).lastName}`
                        : (customerProfile as any)?.email || 'Não informado'
                      }
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <div className="p-2 bg-background rounded border text-sm">
                      {(customerProfile as any)?.email || 'Não informado'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <div className={`p-2 rounded border text-sm ${!(customerProfile as any)?.phone ? 'bg-yellow-50 border-yellow-200' : 'bg-background'}`}>
                      {(customerProfile as any)?.phone || (
                        <span className="text-yellow-700 font-medium">⚠️ Telefone não cadastrado</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Endereço de entrega</label>
                    <div className={`p-2 rounded border text-sm ${!(customerProfile as any)?.address ? 'bg-yellow-50 border-yellow-200' : 'bg-background'}`}>
                      {(customerProfile as any)?.address || (
                        <span className="text-yellow-700 font-medium">⚠️ Endereço não cadastrado</span>
                      )}
                    </div>
                  </div>

                  {(!(customerProfile as any)?.phone || !(customerProfile as any)?.address) && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ Informações incompletas
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Complete seu perfil antes de fazer pedidos. Acesse "Meu Perfil" no menu principal e clique em "Editar Perfil".
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Para alterar seus dados, acesse a seção "Meu Perfil" no menu principal.
                  </p>
                </div>
              ) : (
                // Cliente não autenticado para delivery
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    🚫 Perfil não encontrado
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    É necessário ter um perfil cadastrado para fazer pedidos. Faça login ou cadastre-se.
                  </p>
                </div>
              )}

              {/* Campo de observações - editável */}
              <div>
                <label className="block text-sm font-medium mb-1">Observações sobre o pedido</label>
                <Textarea
                  value={customer.notes}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  placeholder="Observações especiais sobre o pedido (opcional)"
                  data-testid="input-customer-notes"
                  rows={3}
                />
              </div>

              {/* Seção de Cupom - Ocultar para pedidos de mesa */}
              {!isTableOrder && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Cupom de Desconto
                  </h3>
                  
                  {!appliedCoupon ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Digite o código do cupom"
                          className="flex-1"
                          data-testid="input-coupon-code"
                        />
                        <Button 
                          onClick={applyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          size="sm"
                          data-testid="button-apply-coupon"
                        >
                          {couponLoading ? "..." : "Aplicar"}
                        </Button>
                      </div>
                      
                      {couponError && (
                        <p className="text-sm text-red-600" data-testid="text-coupon-error">
                          {couponError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            {appliedCoupon.code}
                          </Badge>
                          <span className="text-sm text-green-700">
                            {appliedCoupon.discountType === 'percentage' 
                              ? `${appliedCoupon.discountValue}% OFF`
                              : `R$ ${parseFloat(appliedCoupon.discountValue).toFixed(2)} OFF`
                            }
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={removeCoupon}
                          data-testid="button-remove-coupon"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-green-600">
                        {appliedCoupon.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Resumo do Pedido */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Resumo do Pedido</h4>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}</span>
                  <span>{isTableOrder ? 'Mesa ' + (tableInfo?.number || 'N/A') : 'Delivery'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {getFinalTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCheckout(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleOrder}
                  className="flex-1"
                  data-testid="button-confirm-order"
                >
                  Confirmar Pedido
                </Button>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Avaliação */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {userReview ? 'Editar Avaliação' : 'Avaliar Restaurante'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Informações do Restaurante */}
            <div className="text-center">
              <h3 className="font-semibold text-lg">{(restaurant as any)?.name}</h3>
              <p className="text-sm text-muted-foreground">{(restaurant as any)?.category}</p>
            </div>

            {/* Sistema de Estrelas */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-center">
                Dê sua nota (obrigatório)
              </label>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110"
                    data-testid={`star-${star}`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredStar || reviewRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {reviewRating > 0 && (
                  <>
                    {reviewRating === 1 && "Muito ruim"}
                    {reviewRating === 2 && "Ruim"}
                    {reviewRating === 3 && "Regular"}
                    {reviewRating === 4 && "Bom"}
                    {reviewRating === 5 && "Excelente"}
                  </>
                )}
              </p>
            </div>

            {/* Campo de Comentário */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Deixe um comentário (opcional)
              </label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Conte-nos sobre sua experiência..."
                rows={3}
                maxLength={500}
                data-testid="textarea-review-comment"
              />
              <p className="text-xs text-muted-foreground text-right">
                {reviewComment.length}/500 caracteres
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewComment("");
                  setHoveredStar(0);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (reviewRating > 0) {
                    createReviewMutation.mutate({
                      rating: reviewRating,
                      comment: reviewComment.trim() || undefined
                    });
                  }
                }}
                disabled={reviewRating === 0 || createReviewMutation.isPending}
                className="flex-1"
                data-testid="button-submit-review"
              >
                {createReviewMutation.isPending 
                  ? "Enviando..." 
                  : userReview 
                    ? "Atualizar" 
                    : "Enviar"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}