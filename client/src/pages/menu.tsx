import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
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
  Truck
} from "lucide-react";

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
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });

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

  const handleOrder = async () => {
    if (!customer.name || !customer.phone || !customer.address) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
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
      const orderData = {
        restaurantId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        notes: customer.notes,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        subtotal: getTotalPrice(),
        deliveryFee: parseFloat(restaurant?.deliveryFee || "0"),
        total: getTotalPrice() + parseFloat(restaurant?.deliveryFee || "0")
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

      // Limpar carrinho e dados do cliente
      setCart([]);
      setCustomer({ name: "", phone: "", address: "", notes: "" });
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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary mb-2">{restaurant.name}</h1>
              <p className="text-muted-foreground mb-4">{restaurant.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{restaurant.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.openingTime} - {restaurant.closingTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  <span>Taxa de entrega: R$ {restaurant.deliveryFee}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{restaurant.rating}</span>
                </div>
                <Badge variant="secondary">{restaurant.category}</Badge>
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

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Menu Principal */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-6">Cardápio</h2>
            
            {productsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : products.length === 0 ? (
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
                {categories.map((category: any) => {
                  const categoryProducts = products.filter((product: any) => product.categoryId === category.id);
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
                  const uncategorizedProducts = products.filter((product: any) => !product.categoryId);
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
                        <div className="flex justify-between">
                          <span>Taxa de entrega:</span>
                          <span>R$ {restaurant.deliveryFee}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>R$ {(getTotalPrice() + parseFloat(restaurant.deliveryFee || "0")).toFixed(2)}</span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Finalizar Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <Input
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Seu nome completo"
                  data-testid="input-customer-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Telefone *</label>
                <Input
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  data-testid="input-customer-phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Endereço de entrega *</label>
                <Textarea
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                  data-testid="input-customer-address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <Textarea
                  value={customer.notes}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  placeholder="Observações sobre o pedido (opcional)"
                  data-testid="input-customer-notes"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total do pedido:</span>
                  <span>R$ {(getTotalPrice() + parseFloat(restaurant.deliveryFee || "0")).toFixed(2)}</span>
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
      )}
    </div>
  );
}