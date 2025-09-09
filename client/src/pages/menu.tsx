import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  X
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

  // Buscar dados do restaurante
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !!restaurantId,
  });

  // Buscar produtos do restaurante
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/products`],
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

  const getDeliveryFee = () => {
    return isTableOrder ? 0 : parseFloat((restaurant as any)?.deliveryFee || "0");
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

  const handleOrder = async () => {
    // Validar se o cliente tem perfil completo
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
      const orderData = {
        restaurantId,
        customerName,
        customerPhone: (customerProfile as any)?.phone || '',
        customerAddress: isTableOrder ? `Mesa ${tableInfo?.number || 'N/A'}` : (customerProfile as any)?.address || 'Endereço não informado',
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
      {/* Header do Restaurante */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Botão de Voltar ao Início */}
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => {
                // Se usuário está autenticado como cliente, voltar para painel do cliente
                if (isAuthenticated) {
                  setLocation('/customer-panel');
                } else {
                  setLocation('/');
                }
              }}
              className="flex items-center gap-2"
              data-testid="button-back-home"
            >
              <Home className="w-4 h-4" />
              {isAuthenticated ? 'Voltar ao Painel' : 'Voltar ao Início'}
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary mb-2">{(restaurant as any)?.name}</h1>
              <p className="text-muted-foreground mb-4">{(restaurant as any)?.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{(restaurant as any)?.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{(restaurant as any)?.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{(restaurant as any)?.openingTime} - {(restaurant as any)?.closingTime}</span>
                </div>
                {!isTableOrder && (
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    <span>Taxa de entrega: R$ {(restaurant as any)?.deliveryFee}</span>
                  </div>
                )}
                {isTableOrder && (
                  <div className="flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    <span>Pedido para consumir no local - Mesa {tableInfo?.number || 'N/A'}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{(restaurant as any)?.rating}</span>
                </div>
                <Badge variant="secondary">{(restaurant as any)?.category}</Badge>
              </div>
            </div>

            {/* Botão do Carrinho */}
            <div className="relative">
              <Button 
                onClick={() => setShowCart(!showCart)}
                className="relative"
                data-testid="button-cart"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrinho
                {getTotalItems() > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
                  >
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Cupons em Destaque */}
      <CouponsSection restaurantId={restaurantId} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Menu Principal */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-6">Cardápio</h2>
            
            {productsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (products as any[]).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">Nenhum produto disponível</h3>
                  <p className="text-muted-foreground">
                    Este restaurante ainda não cadastrou produtos no cardápio.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {(categories as any[]).map((category: any) => {
                  const categoryProducts = (products as any[]).filter((product: any) => product.categoryId === category.id);
                  if (categoryProducts.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <h3 className="text-xl font-semibold mb-4">{category.name}</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {categoryProducts.map((product: any) => (
                          <Card key={product.id} className="overflow-hidden">
                            {product.imageUrl && (
                              <div className="aspect-video bg-muted">
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">{product.name}</h4>
                              {product.description && (
                                <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-green-600">
                                  R$ {parseFloat(product.price).toFixed(2)}
                                </span>
                                <Button 
                                  size="sm"
                                  onClick={() => addToCart(product)}
                                  data-testid={`button-add-${product.id}`}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Adicionar
                                </Button>
                              </div>
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
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Outros Produtos</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uncategorizedProducts.map((product: any) => (
                          <Card key={product.id} className="overflow-hidden">
                            {product.imageUrl && (
                              <div className="aspect-video bg-muted">
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">{product.name}</h4>
                              {product.description && (
                                <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-green-600">
                                  R$ {parseFloat(product.price).toFixed(2)}
                                </span>
                                <Button 
                                  size="sm"
                                  onClick={() => addToCart(product)}
                                  data-testid={`button-add-${product.id}`}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Adicionar
                                </Button>
                              </div>
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

          {/* Sidebar do Carrinho */}
          {showCart && (
            <div className="w-80">
              <Card className="sticky top-6">
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
            </div>
          )}
        </div>
      </div>

      {/* Modal de Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-md my-8">
            <Card className="w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Finalizar Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dados do cliente - somente leitura */}
              {customerProfile ? (
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

              {/* Seção de Cupom */}
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
    </div>
  );
}