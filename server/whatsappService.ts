import { db } from "./db";
import { restaurants } from "@shared/schema";
import { eq } from "drizzle-orm";

interface WhatsAppMessage {
  number: string;
  text: string;
}

class WhatsAppService {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string = "Restaurante";

  constructor() {
    this.apiUrl = process.env.EVOLUTION_API_URL || "";
    // Force HTTPS if URL contains render.com
    if (this.apiUrl.includes('render.com') && this.apiUrl.startsWith('http://')) {
      this.apiUrl = this.apiUrl.replace('http://', 'https://');
      console.log(`Converted API URL to HTTPS: ${this.apiUrl}`);
    }
    this.apiKey = process.env.EVOLUTION_API_KEY || "";
    
    if (!this.apiUrl || !this.apiKey) {
      console.warn("Evolution API credentials not configured");
    }
  }

  private async makeRequest(endpoint: string, data: any) {
    if (!this.apiUrl || !this.apiKey) {
      console.error("Evolution API credentials not configured");
      return null;
    }

    try {
      // Remove trailing slash from apiUrl and leading slash from endpoint to avoid double slashes
      const cleanApiUrl = this.apiUrl.replace(/\/+$/, '');
      const cleanEndpoint = endpoint.replace(/^\/+/, '');
      const fullUrl = `${cleanApiUrl}/${cleanEndpoint}`;
      
      console.log(`Sending WhatsApp request to: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": this.apiKey,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`WhatsApp API error: ${response.status} ${response.statusText}`);
        console.error(`Response body: ${errorText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return null;
    }
  }

  async sendMessage(message: WhatsAppMessage) {
    const endpoint = `/message/sendText/${this.instanceName}`;
    const data = {
      number: message.number,
      text: message.text,
    };

    return await this.makeRequest(endpoint, data);
  }

  async sendOrderStatusNotification(
    restaurantId: string,
    customerPhone: string,
    orderNumber: number,
    newStatus: string,
    customerName: string
  ) {
    try {
      // Buscar o número de notificação do restaurante
      const [restaurant] = await db
        .select({ notificationWhatsapp: restaurants.notificationWhatsapp })
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

      if (!restaurant?.notificationWhatsapp) {
        console.warn(`Restaurant ${restaurantId} doesn't have notification WhatsApp configured`);
        return false;
      }

      // Criar mensagem baseada no status
      let messageText = "";
      
      switch (newStatus) {
        case "confirmed":
          messageText = `🍽️ *Pedido Confirmado!*\n\nOlá ${customerName}!\n\nSeu pedido #${orderNumber} foi confirmado e está sendo preparado.\n\nObrigado pela preferência! 😊`;
          break;
        case "preparing":
          messageText = `👨‍🍳 *Preparando seu Pedido*\n\nOlá ${customerName}!\n\nSeu pedido #${orderNumber} está sendo preparado pela nossa equipe.\n\nEm breve estará pronto! 🔥`;
          break;
        case "ready":
          messageText = `✅ *Pedido Pronto!*\n\nOlá ${customerName}!\n\nSeu pedido #${orderNumber} está pronto para retirada/entrega.\n\nAguardamos você! 📦`;
          break;
        case "out_for_delivery":
          messageText = `🚚 *Saiu para Entrega*\n\nOlá ${customerName}!\n\nSeu pedido #${orderNumber} saiu para entrega e chegará em breve.\n\nFique atento! 🏃‍♂️💨`;
          break;
        case "delivered":
          messageText = `🎉 *Pedido Entregue!*\n\nOlá ${customerName}!\n\nSeu pedido #${orderNumber} foi entregue com sucesso.\n\nEsperamos que tenha gostado! Avalie nossa comida! ⭐`;
          break;
        case "cancelled":
          messageText = `❌ *Pedido Cancelado*\n\nOlá ${customerName}!\n\nInfelizmente seu pedido #${orderNumber} foi cancelado.\n\nPara mais informações, entre em contato conosco. 📞`;
          break;
        default:
          messageText = `📋 *Atualização do Pedido*\n\nOlá ${customerName}!\n\nSeu pedido #${orderNumber} teve o status atualizado para: ${newStatus}\n\nObrigado! 😊`;
      }

      // Limpar e formatar o número do cliente
      const cleanCustomerPhone = customerPhone.replace(/\D/g, "");
      const formattedCustomerPhone = cleanCustomerPhone.startsWith("55") 
        ? cleanCustomerPhone 
        : `55${cleanCustomerPhone}`;

      // Enviar mensagem para o cliente
      const result = await this.sendMessage({
        number: formattedCustomerPhone,
        text: messageText,
      });

      if (result) {
        console.log(`WhatsApp notification sent for order ${orderNumber} to ${customerPhone}`);
        return true;
      } else {
        console.error(`Failed to send WhatsApp notification for order ${orderNumber}`);
        return false;
      }
    } catch (error) {
      console.error("Error sending order status notification:", error);
      return false;
    }
  }
}

export default new WhatsAppService();