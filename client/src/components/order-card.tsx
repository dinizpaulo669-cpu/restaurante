import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Printer, MessageSquare, Send, User, Phone, MapPin, Table, Truck, Edit3, Eye } from "lucide-react";
import type { Order } from "@shared/schema";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (status: string) => void;
  onPrint: () => void;
  onEdit?: (order: Order) => void;
  isUpdatingStatus: boolean;
}

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  preparing: { label: "Preparando", color: "bg-orange-100 text-orange-800" },
  ready: { label: "Pronto", color: "bg-blue-100 text-blue-800" },
  out_for_delivery: { label: "A caminho", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export function OrderCard({ order, onStatusUpdate, onPrint, onEdit, isUpdatingStatus }: OrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  
  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  
  // Buscar mensagens do pedido
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${order.id}/messages`],
    enabled: !!order.id,
  });

  // Buscar itens do pedido para impressão
  const { data: orderItems = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${order.id}/items`],
    enabled: !!order.id,
  });
  
  // Contar mensagens não lidas do cliente
  const unreadCount = Array.isArray(messages) ? messages.filter((msg: any) => msg.senderType === "customer" && !msg.isRead).length : 0;
  
  // Marcar mensagens como lidas
  const markMessagesAsReadMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/orders/${order.id}/messages/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}/messages`] });
    },
    onError: () => {
      console.log("Erro ao marcar mensagens como lidas");
    }
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => apiRequest("POST", `/api/orders/${order.id}/messages`, { message, senderType: "restaurant" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}/messages`] });
      setNewMessage("");
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada ao cliente"
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

  // Função para abrir chat e marcar mensagens como lidas
  const handleOpenChat = () => {
    if (unreadCount > 0) {
      markMessagesAsReadMutation.mutate();
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };
  
  const handlePrint = () => {
    console.log('Imprimir pedido:', order.id);
    
    // Gerar lista de produtos
    const productsHtml = orderItems.length > 0 ? orderItems.map((item: any) => `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px dotted #666;">
        <div style="flex: 1;">
          <div style="font-weight: bold;">${item.product?.name || 'Produto'}</div>
          ${item.specialInstructions ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">Obs: ${item.specialInstructions}</div>` : ''}
        </div>
        <div style="text-align: right; margin-left: 10px;">
          <div>${item.quantity}x R$ ${parseFloat(item.unitPrice || 0).toFixed(2)}</div>
          <div style="font-weight: bold;">R$ ${parseFloat(item.totalPrice || 0).toFixed(2)}</div>
        </div>
      </div>
    `).join('') : '<div style="text-align: center; color: #666; font-style: italic;">Nenhum produto encontrado</div>';
    
    // Criar conteúdo para impressão
    const printContent = `
      <div style="font-family: monospace; width: 350px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">PEDIDO #${order.orderNumber}</h2>
          <p style="margin: 5px 0; font-size: 12px;">${new Date(order.createdAt || new Date()).toLocaleString('pt-BR')}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="margin-bottom: 8px;"><strong>Cliente:</strong> ${order.customerName}</div>
          ${order.customerPhone ? `<div style="margin-bottom: 8px;"><strong>Telefone:</strong> ${order.customerPhone}</div>` : ''}
          ${order.customerAddress ? `<div style="margin-bottom: 8px;"><strong>Endereço:</strong> ${order.customerAddress}</div>` : ''}
          <div style="margin-bottom: 8px;"><strong>Tipo:</strong> ${order.orderType === "delivery" ? "Entrega" : order.orderType === "table" ? "Mesa" : "Retirada"}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #333;">PRODUTOS:</h3>
          ${productsHtml}
        </div>
        
        ${order.notes ? `<div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border: 1px dashed #999;"><strong>Observações:</strong><br>${order.notes}</div>` : ''}
        
        <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
            <span>Subtotal:</span>
            <span>R$ ${parseFloat(String(order.subtotal || order.total || 0)).toFixed(2)}</span>
          </div>
          ${order.deliveryFee && parseFloat(String(order.deliveryFee || 0)) > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span>Taxa de Entrega:</span>
              <span>R$ ${parseFloat(String(order.deliveryFee)).toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 1px solid #333; padding-top: 8px;">
            <span>TOTAL:</span>
            <span>R$ ${parseFloat(String(order.total || 0)).toFixed(2)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #666;">
          <p style="margin: 0;">Obrigado pela preferência!</p>
          <p style="margin: 5px 0 0 0;">RestaurantePro System</p>
        </div>
      </div>
    `;
    
    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido #${order.orderNumber}</title>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 1cm; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
    
    // Chamar callback original se existir
    if (onPrint) {
      onPrint();
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

  const getOrderTypeIcon = () => {
    if (order.orderType === 'table') return <Table className="w-4 h-4" />;
    if (order.orderType === 'delivery') return <Truck className="w-4 h-4" />;
    return null;
  };
  
  return (
    <Card data-testid={`order-card-${order.id}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-lg flex items-center space-x-2" data-testid={`order-number-${order.id}`}>
                {getOrderTypeIcon()}
                <span>#{order.orderNumber}</span>
              </h4>
              <Badge className={statusInfo.color} data-testid={`order-status-${order.id}`}>
                {statusInfo.label}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground" data-testid={`order-customer-${order.id}`}>
                  {order.customerName} • {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'Agora'}
                </span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground" data-testid={`order-phone-${order.id}`}>
                    {order.customerPhone}
                  </span>
                </div>
              )}
              {order.customerAddress && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground max-w-xs truncate" data-testid={`order-address-${order.id}`}>
                    {order.customerAddress}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary" data-testid={`order-total-${order.id}`}>
              R$ {order.total}
            </p>
            <p className="text-sm text-muted-foreground" data-testid={`order-type-${order.id}`}>
              {order.orderType === "delivery" ? "Entrega" : order.orderType === "table" ? "Mesa" : "Retirada"}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm" data-testid={`order-notes-${order.id}`}>
              <strong>Observações:</strong> {order.notes}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="flex space-x-2">
            <Select onValueChange={onStatusUpdate} disabled={isUpdatingStatus}>
              <SelectTrigger className="w-32" data-testid={`select-status-${order.id}`}>
                <SelectValue placeholder={statusInfo.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="ready">Pronto</SelectItem>
                <SelectItem value="out_for_delivery">A caminho</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Botão de mensagens */}
            <Dialog onOpenChange={(open) => {
              if (open && unreadCount > 0) {
                handleOpenChat();
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Chat - Pedido #{order.orderNumber}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Lista de mensagens */}
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
                              message.senderType === "restaurant" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs p-3 rounded-lg shadow-sm ${
                                message.senderType === "restaurant"
                                  ? "bg-primary text-primary-foreground border border-primary/20"
                                  : "bg-muted text-foreground border border-border"
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

                  {/* Enviar nova mensagem */}
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
              </DialogContent>
            </Dialog>
            
            {/* Botão de corrigir */}
            {onEdit && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onEdit(order)}
                data-testid={`button-edit-${order.id}`}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Corrigir
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            {/* Botão visualizar */}
            <Button 
              onClick={() => setShowViewModal(true)}
              variant="outline" 
              size="sm"
              data-testid={`button-view-${order.id}`}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            
            <Button 
              onClick={handlePrint}
              variant="outline" 
              size="sm"
              data-testid={`button-print-${order.id}`}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {order.estimatedDeliveryTime && (
          <div className="mt-3 text-sm text-muted-foreground" data-testid={`order-estimated-time-${order.id}`}>
            <i className="fas fa-clock mr-1"></i>
            Previsão: {new Date(order.estimatedDeliveryTime).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </CardContent>
      
      {/* Modal de visualização do pedido */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{order.orderNumber}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Informações do cliente */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Nome:</strong> {order.customerName}</div>
                  <div><strong>Tipo:</strong> {order.orderType === "delivery" ? "Entrega" : order.orderType === "table" ? "Mesa" : "Retirada"}</div>
                  {order.customerPhone && <div><strong>Telefone:</strong> {order.customerPhone}</div>}
                  <div><strong>Status:</strong> <Badge className={statusInfo.color}>{statusInfo.label}</Badge></div>
                  {order.customerAddress && (
                    <div className="col-span-2"><strong>Endereço:</strong> {order.customerAddress}</div>
                  )}
                </div>
              </div>
              
              {/* Produtos do pedido */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Produtos do Pedido</h3>
                {orderItems.length > 0 ? (
                  <div className="space-y-3">
                    {orderItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.product?.name || 'Produto'}</div>
                          {item.specialInstructions && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Observações: {item.specialInstructions}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {item.quantity}x R$ {parseFloat(String(item.unitPrice || 0)).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">R$ {parseFloat(String(item.totalPrice || 0)).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Nenhum produto encontrado</p>
                )}
              </div>
              
              {/* Valores */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Valores</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {parseFloat(String(order.subtotal || order.total || 0)).toFixed(2)}</span>
                  </div>
                  {order.deliveryFee && parseFloat(String(order.deliveryFee || 0)) > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de Entrega:</span>
                      <span>R$ {parseFloat(String(order.deliveryFee)).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>R$ {parseFloat(String(order.total || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Observações */}
              {order.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Observações</h3>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {order.notes}
                  </div>
                </div>
              )}
              
              {/* Informações adicionais */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Pedido</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Data:</strong> {new Date(order.createdAt || new Date()).toLocaleString('pt-BR')}</div>
                  {order.estimatedDeliveryTime && (
                    <div><strong>Previsão:</strong> {new Date(order.estimatedDeliveryTime).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</div>
                  )}
                  {order.paymentMethod && <div><strong>Pagamento:</strong> {order.paymentMethod}</div>}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
