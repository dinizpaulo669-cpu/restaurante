import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { db } from "./db";
import { setupAuth, isDevAuthenticated } from "./replitAuth";
import { insertRestaurantSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema, insertCategorySchema } from "@shared/schema";
import { users, restaurants, products, categories, orders, orderItems, userFavorites, orderMessages } from "@shared/schema";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // === AUTH ROUTES ===
  app.get('/api/auth/user', isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dev auth route
  app.get('/api/dev/auth/user', async (req: any, res) => {
    try {
      if (req.session.user) {
        return res.json(req.session.user);
      }
      
      const devUser = {
        id: "dev-user-internal",
        email: "dev@example.com",
        role: "customer",
        firstName: "Usuario",
        lastName: "Logado"
      };
      res.json(devUser);
    } catch (error) {
      console.error("Error fetching dev user:", error);
      res.status(500).json({ message: "Failed to fetch dev user" });
    }
  });

  // === RESTAURANT ROUTES ===
  app.get("/api/restaurants", async (req, res) => {
    try {
      const { search, category, limit } = req.query;
      const conditions = [eq(restaurants.isActive, true)];
      
      if (search) {
        const searchCondition = or(
          ilike(restaurants.name, `%${search}%`),
          ilike(restaurants.description, `%${search}%`),
          ilike(restaurants.category, `%${search}%`)
        );
        conditions.push(searchCondition);
      }
      
      if (category) {
        conditions.push(eq(restaurants.category, category));
      }
      
      const result = await db
        .select()
        .from(restaurants)
        .where(and(...conditions))
        .limit(limit ? parseInt(limit as string) : 20)
        .orderBy(desc(restaurants.rating));
        
      res.json(result);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, req.params.id))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.get("/api/restaurants/:id/products", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(products)
        .where(eq(products.restaurantId, req.params.id))
        .orderBy(products.sortOrder);
        
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/restaurants/:id/categories", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.restaurantId, req.params.id))
        .orderBy(categories.sortOrder);
        
      res.json(result);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // === ORDER ROUTES ===
  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      
      // Get next order number for the restaurant
      const [lastOrder] = await db
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(eq(orders.restaurantId, orderData.restaurantId))
        .orderBy(desc(orders.orderNumber))
        .limit(1);
      
      const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;
      
      // Create order
      const [order] = await db
        .insert(orders)
        .values({
          ...orderData,
          customerId: "dev-user-internal", // Default customer ID
          orderNumber: nextOrderNumber,
          status: "pending",
          orderType: "delivery",
          paymentMethod: "pix"
        })
        .returning();
      
      // Save order items if provided
      if (items && items.length > 0) {
        const orderItemsData = items.map((item: any) => ({
          ...item,
          orderId: order.id
        }));
        await db.insert(orderItems).values(orderItemsData);
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/customer/orders", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      const customerOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerId: orders.customerId,
          restaurantId: orders.restaurantId,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          customerAddress: orders.customerAddress,
          status: orders.status,
          orderType: orders.orderType,
          subtotal: orders.subtotal,
          deliveryFee: orders.deliveryFee,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
          notes: orders.notes,
          estimatedDeliveryTime: orders.estimatedDeliveryTime,
          deliveredAt: orders.deliveredAt,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          // Incluir dados do restaurante
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
            category: restaurants.category,
            phone: restaurants.phone,
            address: restaurants.address
          }
        })
        .from(orders)
        .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .where(eq(orders.customerId, userId))
        .orderBy(desc(orders.createdAt));
        
      res.json(customerOrders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // === CUSTOMER ROUTES ===
  app.get("/api/customer/favorites", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      const favorites = await db
        .select({
          restaurant: restaurants
        })
        .from(userFavorites)
        .leftJoin(restaurants, eq(userFavorites.restaurantId, restaurants.id))
        .where(eq(userFavorites.userId, userId));
        
      res.json(favorites.map(f => f.restaurant));
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get("/api/customer/profile", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      let [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        [user] = await db.insert(users).values({
          id: userId,
          email: "dev@example.com",
          firstName: "Usuario",
          lastName: "Logado",
          role: "customer"
        }).returning();
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/customer/stats", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      // Contar pedidos
      const [orderCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.customerId, userId));

      // Contar favoritos
      const [favoritesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userFavorites)
        .where(eq(userFavorites.userId, userId));

      // Calcular total gasto
      const [totalSpent] = await db
        .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
        .from(orders)
        .where(and(eq(orders.customerId, userId), eq(orders.status, "delivered")));

      res.json({
        totalOrders: orderCount?.count || 0,
        favoritesCount: favoritesCount?.count || 0,
        totalSpent: Number(totalSpent?.total || 0),
        averageRating: 4.8
      });
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // === INTERNAL LOGIN ===
  app.post("/api/internal-login", async (req, res) => {
    try {
      const { role } = req.body;
      const user = {
        id: "dev-user-internal",
        email: "dev@example.com", 
        firstName: "Usuario",
        lastName: "Logado",
        role: role || "customer"
      };
      
      req.session.user = user;
      res.json({ message: "Login realizado com sucesso", user });
    } catch (error) {
      console.error("Error in internal login:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // === DEV RESTAURANT ===
  app.get("/api/dev/my-restaurant", async (req, res) => {
    try {
      // Buscar o restaurante do dev user
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  // WebSocket Setup
  const httpServer = createServer();

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const connectionId = Math.random().toString(36).substring(2, 15);
    console.log(`Nova conexão WebSocket: ${connectionId}`);

    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      connectionId: connectionId
    }));

    ws.send(JSON.stringify({
      type: 'authenticated',
      userId: 'dev-user-internal',
      userType: 'customer'
    }));

    ws.on('close', () => {
      console.log(`Conexão WebSocket fechada: ${connectionId}`);
    });

    ws.on('error', (error) => {
      console.error(`Erro WebSocket ${connectionId}:`, error);
    });
  });

  return httpServer;
}