import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type WebSocketOptions = {
  userId?: string;
  userType?: 'customer' | 'restaurant';
  orderId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onStatusUpdate?: (status: string, order: any) => void;
  onNewMessage?: (message: any) => void;
};

export function useWebSocket(options: WebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }
    
    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Autenticar se temos informações do usuário
      if (options.userId && options.userType) {
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: options.userId,
          userType: options.userType
        }));
      }
      
      // Juntar-se ao pedido específico se fornecido
      if (options.orderId) {
        ws.send(JSON.stringify({
          type: 'join_order',
          orderId: options.orderId
        }));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Log das mensagens para debug
        console.log('WebSocket mensagem recebida:', message);
        
        // Processar diferentes tipos de mensagem
        switch (message.type) {
          case 'connection':
            console.log('Conexão confirmada:', message.connectionId);
            break;
            
          case 'authenticated':
            console.log('Autenticado como:', message.userType, message.userId);
            break;
            
          case 'joined_order':
            console.log('Conectado ao pedido:', message.orderId);
            break;
            
          case 'new_message':
            // Invalidar queries de mensagens para atualizar UI
            queryClient.invalidateQueries({ 
              queryKey: [`/api/orders/${message.message.orderId}/messages`] 
            });
            
            // Callback personalizado
            if (options.onNewMessage) {
              options.onNewMessage(message.message);
            }
            
            // Mostrar toast se for mensagem de outro usuário
            if (message.message.senderType !== options.userType) {
              toast({
                title: "Nova mensagem",
                description: `${message.message.senderType === 'restaurant' ? 'Restaurante' : 'Cliente'}: ${message.message.message}`,
                duration: 5000,
              });
            }
            break;
            
          case 'status_updated':
          case 'order_status_updated':
            // Invalidar queries de pedidos para atualizar UI
            queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
            
            // Callback personalizado
            if (options.onStatusUpdate) {
              options.onStatusUpdate(message.status, message.order);
            }
            
            // Mostrar toast de atualização de status
            toast({
              title: "Status do pedido atualizado",
              description: `Pedido #${message.order?.orderNumber || message.orderId.slice(-6)}: ${getStatusLabel(message.status)}`,
              duration: 5000,
            });
            break;
            
          default:
            // Callback genérico
            if (options.onMessage) {
              options.onMessage(message);
            }
        }
        
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket desconectado:', event.code, event.reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      wsRef.current = null;
      
      // Reconectar automaticamente após 3 segundos (apenas se não foi fechamento intencional)
      if (event.code !== 1000) {
        setTimeout(() => {
          connect();
        }, 3000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Erro WebSocket:', error);
      setConnectionStatus('disconnected');
    };
  };
  
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Disconnected by user');
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };
  
  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket não está conectado');
    return false;
  };
  
  // Conectar automaticamente quando o hook é usado
  useEffect(() => {
    connect();
    
    // Cleanup na desmontagem
    return () => {
      disconnect();
    };
  }, [options.userId, options.userType, options.orderId]);
  
  // Função auxiliar para obter label do status
  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'preparing': 'Preparando',
      'ready': 'Pronto',
      'out_for_delivery': 'A caminho',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado',
    };
    return statusLabels[status] || status;
  };
  
  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage
  };
}