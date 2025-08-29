import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";
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
  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Card data-testid={`order-card-${order.id}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-lg" data-testid={`order-number-${order.id}`}>
                #{order.orderNumber}
              </h4>
              <Badge className={statusInfo.color} data-testid={`order-status-${order.id}`}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground" data-testid={`order-customer-${order.id}`}>
              {order.customerName} • {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : 'Agora'}
            </p>
            {order.customerPhone && (
              <p className="text-sm text-muted-foreground" data-testid={`order-phone-${order.id}`}>
                <i className="fas fa-phone mr-1"></i>
                {order.customerPhone}
              </p>
            )}
            {order.customerAddress && (
              <p className="text-sm text-muted-foreground" data-testid={`order-address-${order.id}`}>
                <i className="fas fa-map-marker-alt mr-1"></i>
                {order.customerAddress}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary" data-testid={`order-total-${order.id}`}>
              R$ {order.total}
            </p>
            <p className="text-sm text-muted-foreground" data-testid={`order-type-${order.id}`}>
              {order.orderType === "delivery" ? "Entrega" : "Retirada"}
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
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="ready">Pronto</SelectItem>
                <SelectItem value="out_for_delivery">A caminho</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
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
