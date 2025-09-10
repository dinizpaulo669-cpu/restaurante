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
      console.log(`✅ Converted API URL to HTTPS: ${this.apiUrl}`);
    }
    this.apiKey = process.env.EVOLUTION_API_KEY || "";
    
    console.log(`📡 Evolution API Configuration:`);
    console.log(`   - URL: ${this.apiUrl ? `${this.apiUrl.substring(0, 30)}...` : 'NOT SET'}`);
    console.log(`   - API Key: ${this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET'}`);
    console.log(`   - Instance: ${this.instanceName}`);
    
    if (!this.apiUrl || !this.apiKey) {
      console.error("❌ Evolution API credentials not configured - WhatsApp notifications will fail!");
      console.error("   Please set EVOLUTION_API_URL and EVOLUTION_API_KEY environment variables");
    } else {
      console.log(`✅ Evolution API credentials configured successfully`);
    }
  }

  private async makeRequest(endpoint: string, data: any) {
    if (!this.apiUrl || !this.apiKey) {
      console.error("❌ Evolution API credentials not configured - cannot make request");
      return null;
    }

    try {
      // Remove trailing slash from apiUrl and leading slash from endpoint to avoid double slashes
      const cleanApiUrl = this.apiUrl.replace(/\/+$/, '');
      const cleanEndpoint = endpoint.replace(/^\/+/, '');
      const fullUrl = `${cleanApiUrl}/${cleanEndpoint}`;
      
      console.log(`📡 Sending WhatsApp request:`);
      console.log(`   - URL: ${fullUrl}`);
      console.log(`   - Data:`, JSON.stringify(data, null, 2));
      
      const headers = {
        "Content-Type": "application/json",
        "apikey": this.apiKey,
      };
      
      console.log(`   - Headers: Content-Type: application/json, apikey: ${this.apiKey.substring(0, 8)}...`);
      
      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      console.log(`📨 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ WhatsApp API error: ${response.status} ${response.statusText}`);
        console.error(`❌ Response body: ${errorText}`);
        
        // Log additional debug info for common errors
        if (response.status === 401) {
          console.error(`🔑 Authentication failed - check API key`);
        } else if (response.status === 404) {
          console.error(`🔍 Endpoint not found - check API URL and instance name`);
        } else if (response.status === 500) {
          console.error(`🔥 Server error - check Evolution API server status`);
        }
        
        return null;
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error(`🚨 Invalid JSON response from WhatsApp API`);
        console.error(`   Response might not be JSON format`);
        return null;
      }
      
      console.log(`✅ WhatsApp API response:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error(`💥 Network error sending WhatsApp message:`, error);
      if (error instanceof Error) {
        console.error(`   - Error message: ${error.message}`);
        console.error(`   - Error stack: ${error.stack}`);
      }
      return null;
    }
  }

  async sendMessage(message: WhatsAppMessage) {
    const endpoint = `/message/sendText/${this.instanceName}`;
    const data = {
      number: message.number,
      textMessage: {
        text: message.text
      }
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
    console.log(`\n🚀 Starting WhatsApp notification process:`);
    console.log(`   - Restaurant ID: ${restaurantId}`);
    console.log(`   - Customer Phone: ${customerPhone}`);
    console.log(`   - Order Number: ${orderNumber}`);
    console.log(`   - New Status: ${newStatus}`);
    console.log(`   - Customer Name: ${customerName}`);
    
    try {
      // Buscar o número de notificação do restaurante
      console.log(`📋 Fetching restaurant notification WhatsApp number...`);
      const [restaurant] = await db
        .select({ notificationWhatsapp: restaurants.notificationWhatsapp })
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

      console.log(`🏪 Restaurant data:`, restaurant);

      if (!restaurant?.notificationWhatsapp) {
        console.warn(`⚠️  Restaurant ${restaurantId} doesn't have notification WhatsApp configured`);
        console.warn(`   This won't prevent customer notifications, but restaurant won't receive internal alerts`);
        console.warn(`   Please configure the notificationWhatsapp field in the restaurant settings for full functionality`);
      } else {
        console.log(`📱 Restaurant notification WhatsApp: ${restaurant.notificationWhatsapp}`);
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
      console.log(`📞 Processing customer phone number: ${customerPhone}`);
      const cleanCustomerPhone = customerPhone.replace(/\D/g, "");
      console.log(`   - Cleaned: ${cleanCustomerPhone}`);
      
      const formattedCustomerPhone = cleanCustomerPhone.startsWith("55") 
        ? cleanCustomerPhone 
        : `55${cleanCustomerPhone}`;
      console.log(`   - Formatted: ${formattedCustomerPhone}`);
      
      // Validar se o número tem pelo menos 13 dígitos (55 + DDD + número)
      if (formattedCustomerPhone.length < 13) {
        console.error(`❌ Invalid phone number format: ${formattedCustomerPhone}`);
        console.error(`   Phone number should have at least 13 digits (55 + DDD + number)`);
        return false;
      }

      console.log(`📄 Message to send:`);
      console.log(`${messageText}`);

      // Enviar mensagem para o cliente
      console.log(`📤 Sending WhatsApp message...`);
      const result = await this.sendMessage({
        number: formattedCustomerPhone,
        text: messageText,
      });

      if (result) {
        console.log(`✅ WhatsApp notification sent successfully for order ${orderNumber} to ${customerPhone}`);
        return true;
      } else {
        console.error(`❌ Failed to send WhatsApp notification for order ${orderNumber}`);
        return false;
      }
    } catch (error) {
      console.error(`💥 Error sending order status notification:`, error);
      if (error instanceof Error) {
        console.error(`   - Error message: ${error.message}`);
        console.error(`   - Error stack: ${error.stack}`);
      }
      return false;
    }
  }
}

export default new WhatsAppService();