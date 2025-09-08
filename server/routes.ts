import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { setupAuth, isDevAuthenticated } from "./replitAuth";
import { insertRestaurantSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema, insertCategorySchema, insertTableSchema } from "@shared/schema";
import { users, restaurants, products, categories, orders, orderItems, userFavorites, orderMessages, tables } from "@shared/schema";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;
    if (req.path.includes('/logo') || req.path.includes('/banner')) {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'restaurant');
    } else {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Always setup auth (simplified version for non-Replit deployments)
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
      
      if (search && typeof search === 'string') {
        const searchCondition = or(
          ilike(restaurants.name, `%${search}%`),
          ilike(restaurants.description, `%${search}%`),
          ilike(restaurants.category, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }
      
      if (category && typeof category === 'string') {
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

  app.get("/api/customer/orders", async (req: any, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      // First get all orders for the customer
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
      
      // Then get order items for each order
      const ordersWithItems = await Promise.all(
        customerOrders.map(async (order) => {
          const items = await db
            .select({
              id: orderItems.id,
              quantity: orderItems.quantity,
              unitPrice: orderItems.unitPrice,
              totalPrice: orderItems.totalPrice,
              specialInstructions: orderItems.specialInstructions,
              product: {
                id: products.id,
                name: products.name,
                description: products.description,
                imageUrl: products.imageUrl
              }
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));
          
          return {
            ...order,
            items
          };
        })
      );
        
      res.json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // === MESSAGE ROUTES ===
  
  // Get messages for an order
  app.get("/api/orders/:orderId/messages", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const messages = await db
        .select({
          id: orderMessages.id,
          orderId: orderMessages.orderId,
          senderId: orderMessages.senderId,
          senderType: orderMessages.senderType,
          message: orderMessages.message,
          createdAt: orderMessages.createdAt,
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role
          }
        })
        .from(orderMessages)
        .leftJoin(users, eq(orderMessages.senderId, users.id))
        .where(eq(orderMessages.orderId, orderId))
        .orderBy(orderMessages.createdAt);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a new message
  app.post("/api/orders/:orderId/messages", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { message } = req.body;
      
      let userId = "dev-user-internal";
      if ((req.session as any)?.user?.id) {
        userId = (req.session as any).user.id;
      }
      
      const newMessage = await db
        .insert(orderMessages)
        .values({
          orderId,
          senderId: userId,
          senderType: "customer",
          message
        })
        .returning();
      
      res.json(newMessage[0]);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // === RESTAURANT ORDERS ROUTE ===
  app.get("/api/my-orders", async (req: any, res) => {
    try {
      let userId = "dev-user-internal";
      if ((req.session as any)?.user?.id) {
        userId = (req.session as any).user.id;
      }
      
      // Get restaurant owned by this user
      // For development, use the specific dev restaurant owner ID
      const actualOwnerId = userId === "dev-user-internal" ? "dev-user-123" : userId;
      const userRestaurant = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, actualOwnerId))
        .limit(1);
      
      if (userRestaurant.length === 0) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Get all orders for this restaurant
      const restaurantOrders = await db
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
          updatedAt: orders.updatedAt
        })
        .from(orders)
        .where(eq(orders.restaurantId, userRestaurant[0].id))
        .orderBy(desc(orders.createdAt));
      
      // Get order items for each order
      const ordersWithItems = await Promise.all(
        restaurantOrders.map(async (order) => {
          const items = await db
            .select({
              id: orderItems.id,
              quantity: orderItems.quantity,
              unitPrice: orderItems.unitPrice,
              totalPrice: orderItems.totalPrice,
              specialInstructions: orderItems.specialInstructions,
              product: {
                id: products.id,
                name: products.name,
                description: products.description,
                imageUrl: products.imageUrl
              }
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));
          
          return {
            ...order,
            items
          };
        })
      );
        
      res.json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching restaurant orders:", error);
      res.status(500).json({ message: "Failed to fetch restaurant orders" });
    }
  });

  // === CUSTOMER ROUTES ===
  app.get("/api/customer/favorites", async (req: any, res) => {
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

  app.get("/api/customer/profile", async (req: any, res) => {
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

  app.get("/api/customer/stats", async (req: any, res) => {
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
  app.post("/api/internal-login", async (req: any, res) => {
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

  // === TABLE ROUTES ===
  
  // Get tables for restaurant
  app.get("/api/restaurants/:id/tables", async (req, res) => {
    try {
      const tablesResult = await db
        .select()
        .from(tables)
        .where(eq(tables.restaurantId, req.params.id))
        .orderBy(tables.number);
      
      res.json(tablesResult);
    } catch (error) {
      console.error("Error fetching tables:", error);
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  // Create table
  app.post("/api/tables", async (req: any, res) => {
    try {
      let userId = "dev-user-internal";
      if ((req.session as any)?.user?.id) {
        userId = (req.session as any).user.id;
      }
      
      // Get restaurant owned by this user
      const actualOwnerId = userId === "dev-user-internal" ? "dev-user-123" : userId;
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, actualOwnerId))
        .limit(1);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Generate unique QR code
      const qrCode = `table-${restaurant.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const tableData = insertTableSchema.parse({
        ...req.body,
        restaurantId: restaurant.id,
        qrCode,
      });

      const [table] = await db.insert(tables).values(tableData).returning();
      res.json(table);
    } catch (error) {
      console.error("Error creating table:", error);
      res.status(500).json({ message: "Failed to create table" });
    }
  });

  // Update table
  app.put("/api/tables/:id", async (req, res) => {
    try {
      const [updatedTable] = await db
        .update(tables)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(tables.id, req.params.id))
        .returning();
      
      if (!updatedTable) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(updatedTable);
    } catch (error) {
      console.error("Error updating table:", error);
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  // Delete table
  app.delete("/api/tables/:id", async (req, res) => {
    try {
      await db.delete(tables).where(eq(tables.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting table:", error);
      res.status(500).json({ message: "Failed to delete table" });
    }
  });

  // Get table by QR code (for customer access)
  app.get("/api/tables/qr/:qrCode", async (req, res) => {
    try {
      const [table] = await db
        .select()
        .from(tables)
        .where(eq(tables.qrCode, req.params.qrCode))
        .limit(1);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(table);
    } catch (error) {
      console.error("Error fetching table by QR code:", error);
      res.status(500).json({ message: "Failed to fetch table" });
    }
  });

  // Development routes for tables
  app.get("/api/dev/tables", async (req, res) => {
    try {
      // Get dev restaurant
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Dev restaurant not found" });
      }
      
      const tablesResult = await db
        .select()
        .from(tables)
        .where(eq(tables.restaurantId, restaurant.id))
        .orderBy(tables.number);
      
      res.json(tablesResult);
    } catch (error) {
      console.error("Error fetching dev tables:", error);
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.post("/api/dev/tables", async (req, res) => {
    try {
      // Get dev restaurant
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Dev restaurant not found" });
      }
      
      // Generate unique QR code
      const qrCode = `table-${restaurant.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const tableData = insertTableSchema.parse({
        ...req.body,
        restaurantId: restaurant.id,
        qrCode,
      });

      const [table] = await db.insert(tables).values(tableData).returning();
      res.json(table);
    } catch (error) {
      console.error("Error creating dev table:", error);
      res.status(500).json({ message: "Failed to create table" });
    }
  });

  app.put("/api/dev/tables/:id", async (req, res) => {
    try {
      const [updatedTable] = await db
        .update(tables)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(tables.id, req.params.id))
        .returning();
      
      if (!updatedTable) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(updatedTable);
    } catch (error) {
      console.error("Error updating dev table:", error);
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  app.delete("/api/dev/tables/:id", async (req, res) => {
    try {
      await db.delete(tables).where(eq(tables.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dev table:", error);
      res.status(500).json({ message: "Failed to delete table" });
    }
  });

  // === DEV PRODUCTS ===
  app.post("/api/dev/products", upload.single('image'), async (req: any, res) => {
    try {
      // Buscar o restaurante do usuário de desenvolvimento
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Dev restaurant not found" });
      }

      // Processar dados do formulário
      const formData = {
        ...req.body,
        restaurantId: restaurant.id,
        price: parseFloat(req.body.price),
        costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : undefined,
        stock: parseInt(req.body.stock) || 0,
        preparationTime: parseInt(req.body.preparationTime) || 15,
        isActive: req.body.isActive === 'true',
      };

      // Adicionar URL da imagem se foi feito upload
      if (req.file) {
        formData.imageUrl = `/uploads/products/${req.file.filename}`;
      }

      const productData = insertProductSchema.parse(formData);
      const [product] = await db.insert(products).values(productData).returning();
      res.json(product);
    } catch (error) {
      console.error("Error creating dev product:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create product" });
    }
  });

  app.post("/api/dev/categories", async (req: any, res) => {
    try {
      // Buscar o restaurante do usuário de desenvolvimento
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Dev restaurant not found" });
      }

      const categoryData = insertCategorySchema.parse({
        ...req.body,
        restaurantId: restaurant.id,
      });

      const [category] = await db.insert(categories).values(categoryData).returning();
      res.json(category);
    } catch (error) {
      console.error("Error creating dev category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // WebSocket Setup
  const httpServer = createServer(app);

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