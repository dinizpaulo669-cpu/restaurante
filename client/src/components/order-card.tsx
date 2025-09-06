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
import { Printer, MessageSquare, Send, User, Phone, MapPin, Table, Truck } from "lucide-react";
import type { Order } from "@shared/schema";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (status: string) => void;
  onPrint: () => void;
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

export function OrderCard({ order, onStatusUpdate, onPrint, isUpdatingStatus }: OrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  
  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  
  // Buscar mensagens do pedido
  const { data: messages = [] } = useQuery({
    queryKey: [`/api/orders/${order.id}/messages`],
    enabled: !!order.id,
  });
  
  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => apiRequest("POST", `/api/orders/${order.id}/messages`, { message }),
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
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                  {messages.filter((msg: any) => msg.senderType === "customer" && !msg.isRead).length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                      {messages.filter((msg: any) => msg.senderType === "customer" && !msg.isRead).length}
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
                      {messages.length === 0 ? (
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
                              className={`max-w-xs p-3 rounded-lg ${
                                message.senderType === "restaurant"
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
          </div>
          
          <Button 
            onClick={onPrint}
            variant="outline" 
            size="sm"
            data-testid={`button-print-${order.id}`}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
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
    </Card>
  );
}
