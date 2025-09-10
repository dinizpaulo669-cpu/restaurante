import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import { db } from "./db";
import { setupAuth, isDevAuthenticated } from "./replitAuth";
import { insertRestaurantSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema, insertCategorySchema, insertTableSchema, insertCouponSchema } from "@shared/schema";
import { users, restaurants, products, categories, orders, orderItems, userFavorites, orderMessages, tables, coupons, couponUsages, serviceAreas, insertServiceAreaSchema } from "@shared/schema";
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
          customerId: orderData.orderType === 'table' ? null : "dev-user-internal", // Allow null for table orders
          orderNumber: nextOrderNumber,
          status: "pending",
          orderType: orderData.orderType || "delivery", // Use the orderType from frontend
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

  // Update order
  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const [updatedOrder] = await db
        .update(orders)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });
  
  // Update order status
  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [updatedOrder] = await db
        .update(orders)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
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
      // For development, use the correct owner ID
      const actualOwnerId = userId === "dev-user-internal" ? "owner-123" : userId;
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

  app.put("/api/customer/profile", async (req: any, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }

      const { firstName, lastName, phone, address } = req.body;

      // Atualizar ou criar o usuário
      const [updatedUser] = await db
        .insert(users)
        .values({
          id: userId,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          address: address,
          email: "dev@example.com",
          role: "customer"
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            address: address,
            updatedAt: new Date(),
          },
        })
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      // Buscar usuário no banco pelo email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      // Verificar senha
      if (!user.password) {
        return res.status(401).json({ message: "Usuário não tem senha configurada" });
      }
      
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      // Criar sessão com dados do usuário real
      const sessionUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };
      
      req.session.user = sessionUser;
      res.json({ message: "Login realizado com sucesso", user: sessionUser });
    } catch (error) {
      console.error("Error in internal login:", error);
      res.status(500).json({ message: "Falha no login" });
    }
  });

  // === DEV RESTAURANT ===
  app.get("/api/dev/my-restaurant", async (req: any, res) => {
    try {
      let userId = "dev-user-internal";
      if ((req.session as any)?.user?.id) {
        userId = (req.session as any).user.id;
      }
      
      // Map dev-user-internal to dev-user-123 for restaurant ownership
      const actualOwnerId = userId === "dev-user-internal" ? "dev-user-123" : userId;
      
      // Buscar o restaurante do dev user
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, actualOwnerId))
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

  // Endpoint para buscar bairros de uma cidade
  app.get("/api/neighborhoods/:city/:state", async (req, res) => {
    try {
      const { city, state } = req.params;
      
      // Lista expandida de bairros para grandes cidades brasileiras
      const neighborhoodsData: { [key: string]: string[] } = {
        'Rio de Janeiro': [
          // Zona Sul
          'Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Laranjeiras', 'Urca', 'Leme',
          'Glória', 'Catete', 'Cosme Velho', 'Humaitá', 'Gávea', 'São Conrado', 'Joá',
          // Zona Norte
          'Tijuca', 'Vila Isabel', 'Grajaú', 'Maracanã', 'Praça da Bandeira', 'São Cristóvão',
          'Catumbi', 'Estácio', 'Rio Comprido', 'Santa Teresa', 'Centro', 'Lapa', 'Saúde',
          'Gamboa', 'Santo Cristo', 'Caju', 'Benfica', 'Mangueira', 'Bonsucesso', 'Ramos',
          'Olaria', 'Penha', 'Brás de Pina', 'Cordovil', 'Parada de Lucas', 'Vigário Geral',
          'Jardim América', 'Irajá', 'Vicente de Carvalho', 'Vila da Penha', 'Vista Alegre',
          'Colégio', 'Turiaçu', 'Rocha Miranda', 'Honório Gurgel', 'Oswaldo Cruz', 'Madureira',
          'Vaz Lobo', 'Pavuna', 'Costa Barros', 'Anchieta', 'Parque Anchieta', 'Ricardo de Albuquerque',
          'Coelho Neto', 'Acari', 'Barros Filho', 'Guadalupe', 'Deodoro', 'Vila Militar',
          'Campo dos Afonsos', 'Jardim Sulacap', 'Magalhães Bastos', 'Realengo', 'Padre Miguel',
          'Bangu', 'Senador Camará', 'Santíssimo', 'Campo Grande', 'Cosmos', 'Inhoaíba',
          'Santa Cruz', 'Sepetiba', 'Guaratiba', 'Pedra de Guaratiba', 'Barra de Guaratiba',
          // Zona Oeste
          'Barra da Tijuca', 'Recreio dos Bandeirantes', 'Jacarepaguá', 'Taquara', 'Freguesia',
          'Pechincha', 'Curicica', 'Camorim', 'Vargem Pequena', 'Vargem Grande', 'Itanhangá',
          'Anil', 'Gardênia Azul', 'Cidade de Deus', 'Vila Valqueire', 'Praça Seca',
          'Tanque', 'Campinho', 'Marechal Hermes', 'Bento Ribeiro', 'Oswaldo Cruz',
          'Encantado', 'Abolição', 'Pilares', 'Água Santa', 'Cachambi', 'Engenho de Dentro',
          'Méier', 'Todos os Santos', 'Engenho Novo', 'Sampaio', 'Riachuelo', 'Rocha',
          'São Francisco Xavier', 'Maracanã', 'Alto da Boa Vista', 'Floresta da Tijuca',
          'Andaraí', 'Usina', 'Manguinhos', 'Bonsucesso', 'Higienópolis', 'Maria da Graça',
          'Del Castilho', 'Inhaúma', 'Engenho da Rainha', 'Tomás Coelho', 'Jacaré',
          'Piedade', 'Quintino Bocaiúva', 'Cascadura', 'Cavalcanti', 'Engenheiro Leal',
          'Amadoá', 'Rocha Miranda', 'Honório Gurgel', 'Fazenda Botafogo', 'Coelho Neto'
        ],
        'São Paulo': [
          // Zona Central
          'Centro', 'Sé', 'República', 'Santa Ifigênia', 'Bom Retiro', 'Campos Elíseos', 'Santa Cecília',
          'Higienópolis', 'Pacaembu', 'Consolação', 'Vila Buarque', 'Bela Vista', 'Liberdade',
          'Aclimação', 'Bexiga', 'Luz', 'Barra Funda', 'Água Branca',
          // Zona Sul
          'Vila Mariana', 'Paraíso', 'Ibirapuera', 'Moema', 'Campo Belo', 'Brooklin', 'Vila Olímpia',
          'Itaim Bibi', 'Jardins', 'Jardim Paulista', 'Cerqueira César', 'Vila Nova Conceição',
          'Santo Amaro', 'Vila Andrade', 'Morumbi', 'Real Parque', 'Granja Julieta', 'Chácara Flora',
          'Jabaquara', 'Saúde', 'Cursino', 'Vila Prudente', 'São Lucas', 'Sacomã', 'Ipiranga',
          'Vila Carioca', 'Heliópolis', 'Cidade Tiradentes', 'Guaianases', 'Lajeado', 'Itaim Paulista',
          'Campo Limpo', 'Capela do Socorro', 'Vila das Belezas', 'Jardim São Luís', 'Jardim Ângela',
          'Cidade Ademar', 'Pedreira', 'Cidade Dutra', 'Grajaú', 'Parelheiros', 'Marsilac',
          // Zona Oeste
          'Pinheiros', 'Vila Madalena', 'Jardim Paulistano', 'Alto de Pinheiros', 'Butantã', 'Rio Pequeno',
          'Raposo Tavares', 'Vila Sônia', 'Morumbi', 'Jaguaré', 'Vila Leopoldina', 'Lapa', 'Perdizes',
          'Pompeia', 'Vila Romana', 'Sumaré', 'Barra Funda', 'Freguesia do Ó', 'Brasilândia',
          'Cachoeirinha', 'Limão', 'Casa Verde', 'Mandaqui', 'Santana', 'Carandiru', 'Vila Guilherme',
          'Vila Maria', 'Vila Medeiros', 'Tucuruvi', 'Jaçanã', 'Tremembé', 'Cantareira',
          // Zona Norte
          'Santana', 'Casa Verde', 'Limão', 'Freguesia do Ó', 'Brasilândia', 'Cachoeirinha',
          'Mandaqui', 'Tucuruvi', 'Vila Guilherme', 'Vila Maria', 'Vila Medeiros', 'Jaçanã',
          'Tremembé', 'Cantareira', 'Imirim', 'Lauzane Paulista', 'Vila Constança', 'Jardim Brasil',
          // Zona Leste
          'Mooca', 'Brás', 'Pari', 'Belenzinho', 'Tatuapé', 'Anália Franco', 'Vila Formosa',
          'Carrão', 'Vila Prudente', 'São Lucas', 'Sapopemba', 'São Mateus', 'Iguatemi',
          'Cidade Líder', 'Itaquera', 'José Bonifácio', 'Parque do Carmo', 'Cidade Tiradentes',
          'Guaianases', 'Lajeado', 'Ermelino Matarazzo', 'São Miguel Paulista', 'Vila Jacuí',
          'Jardim Helena', 'Itaim Paulista', 'Vila Curuçá', 'Penha', 'Cangaíba', 'Vila Matilde',
          'Artur Alvim', 'Cidade Patriarca', 'Vila Esperança', 'Vila Ré', 'Ponte Rasa'
        ],
        'Belo Horizonte': [
          // Região Central
          'Centro', 'Savassi', 'Funcionários', 'Lourdes', 'Santo Agostinho', 'Santa Efigênia',
          'Barro Preto', 'Santo Antônio', 'São Pedro', 'União', 'Sagrada Família', 'Coração de Jesus',
          'São Lucas', 'Castelo', 'Anchieta', 'Sion', 'Cruzeiro', 'Carmo', 'Serra',
          // Região Sul
          'Belvedere', 'Mangabeiras', 'Vila Paris', 'Jardim Canadá', 'Nova Lima',
          'Buritis', 'Estoril', 'Bandeirantes', 'Prado', 'Cidade Nova', 'Boa Viagem',
          'Carlos Prates', 'Floresta', 'Lagoinha', 'Bonfim', 'Concórdia', 'Santa Tereza',
          // Região Norte
          'Pampulha', 'Ouro Preto', 'Trevo', 'Liberdade', 'Jaraguá', 'São Cristóvão',
          'Ipiranga', 'Lagoinha', 'Bonfim', 'Concórdia', 'Aparecida', 'Cidade Nova',
          // Região Leste
          'Santa Efigênia', 'Barro Preto', 'Santo Antônio', 'São Pedro', 'União',
          'Sagrada Família', 'Coração de Jesus', 'São Lucas', 'Castelo', 'Anchieta',
          // Região Oeste
          'Gutierrez', 'Padre Eustáquio', 'Betânia', 'Jardim Atlântico', 'Nova Suíça',
          'Planalto', 'São Bento', 'Calafate', 'Barreiro', 'Lindéia', 'Jatobá'
        ],
        'Brasília': [
          'Asa Sul', 'Asa Norte', 'Lago Sul', 'Lago Norte', 'Sudoeste/Octogonal',
          'Noroeste', 'Park Way', 'Cruzeiro', 'Águas Claras', 'Vicente Pires',
          'Taguatinga', 'Ceilândia', 'Guará', 'Sobradinho', 'Planaltina',
          'Paranoá', 'Núcleo Bandeirante', 'Riacho Fundo', 'Samambaia', 'Santa Maria',
          'São Sebastião', 'Recanto das Emas', 'Gama', 'Brazlândia', 'Candangolândia',
          'Jardim Botânico', 'Itapoã', 'SIA', 'SCIA', 'Estrutural'
        ],
        'Salvador': [
          // Centro Histórico e Península de Itapagipe
          'Pelourinho', 'Centro Histórico', 'Dois de Julho', 'Nazaré', 'Barris', 'Tororó',
          'Barbalho', 'Caixa D\'Água', 'Largo do Tanque', 'Soledade', 'Lapinha', 'Liberdade',
          'Curuzu', 'IAPI', 'São Caetano', 'Fazenda Grande do Retiro', 'Tancredo Neves',
          'Beiru', 'Pernambués', 'Cabula', 'Engomadeira', 'Narandiba', 'Sussuarana',
          'Castelo Branco', 'São Marcos', 'Paripe', 'Periperi', 'Coutos', 'Praia Grande',
          'Ribeira', 'Massaranduba', 'Penha', 'Bonfim', 'Monte Serrat', 'Boa Viagem',
          'Calçada', 'Mares', 'Roma', 'Uruguai', 'Alagados', 'Novos Alagados',
          // Orla e Zona Sul
          'Barra', 'Ondina', 'Rio Vermelho', 'Amaralina', 'Pituba', 'Costa Azul',
          'Armação', 'Piatã', 'Itapuã', 'Stella Maris', 'Flamengo', 'Jardim Armação',
          'Patamares', 'Pituaçu', 'Placaford', 'Jardim das Margaridas', 'Imbuí',
          'Caminho das Árvores', 'Alphaville', 'Paralela', 'Iguatemi', 'Acupe de Brotas',
          // Miolo e Subúrbios
          'Graça', 'Vitória', 'Corredor da Vitória', 'Campo Grande', 'Piedade', 'Canela',
          'Garcia', 'Federação', 'Brotas', 'Engenho Velho de Brotas', 'Matatu',
          'Alto das Pombas', 'Chapada do Rio Vermelho', 'Horto Florestal', 'Candeal',
          'Saúde', 'Cosme de Farias', 'Retiro', 'Pero Vaz', 'Fazenda Coutos',
          'Boa Vista de São Caetano', 'Mata Escura', 'Calabetão', 'Jardim Cruzeiro',
          'Alto do Cabrito', 'Nordeste de Amaralina', 'Vila Laura', 'Doron'
        ],
        'Fortaleza': [
          // Centro e Região Central
          'Centro', 'Benfica', 'Fátima', 'José Bonifácio', 'Carlito Pamplona', 'Bom Jardim',
          'Parquelândia', 'Rodolfo Teófilo', 'Monte Castelo', 'Jacarecanga', 'Álvaro Weyne',
          'Vila Ellery', 'Antônio Bezerra', 'Quintino Cunha', 'Henrique Jorge', 'João XXIII',
          'Granja Portugal', 'Granja Lisboa', 'Bela Vista', 'Amadeu Furtado', 'Pirambu',
          'Cristo Redentor', 'Floresta', 'Conjunto Ceará', 'Bom Sucesso', 'Autran Nunes',
          // Região Nobre (Zona Leste)
          'Aldeota', 'Meireles', 'Mucuripe', 'Varjota', 'Joaquim Távora', 'Dionísio Torres',
          'Cocó', 'Dunas', 'Guararapes', 'Papicu', 'Praia do Futuro', 'Salinas',
          'Cidade 2000', 'Edson Queiroz', 'De Lourdes', 'São João do Tauape', 'Itaoca',
          'Parreão', 'Praia de Iracema', 'Cais do Porto', 'Vicente Pinzon', 'Volta da Jurema',
          'Náutico', 'Manuel Dias Branco', 'Engenheiro Luciano Cavalcante', 'Sapiranga',
          'Coaçu', 'Sabiaguaba', 'Cambeba', 'Lagoa Redonda', 'Messejana', 'Curió',
          // Zona Sul
          'José de Alencar', 'Pedras', 'Dendê', 'Paupina', 'Couto Fernandes', 'Damas',
          'Montese', 'Bom Futuro', 'Parangaba', 'Vila União', 'Serrinha', 'Maraponga',
          'Jóquei Clube', 'Parque Araxá', 'Itaperi', 'Passaré', 'Barroso', 'Castelão',
          'Aeroporto', 'Água Fria', 'Prefeito José Walter', 'Jardim das Oliveiras'
        ],
        'Recife': [
          'Boa Viagem', 'Pina', 'Brasília Teimosa', 'Imbiribeira', 'Setúbal',
          'Cordeiro', 'Torrões', 'Curado', 'Barro', 'Cohab', 'Ibura',
          'Ipsep', 'Estância', 'Jordão', 'Areias', 'Mustardinha', 'San Martin',
          'Centro', 'São José', 'Santo Antônio', 'Boa Vista', 'Derby',
          'Graças', 'Espinheiro', 'Aflitos', 'Tamarineira', 'Casa Forte',
          'Parnamirim', 'Santana', 'Fundão', 'Poço da Panela', 'Monteiro'
        ],
        'Porto Alegre': [
          'Centro Histórico', 'Cidade Baixa', 'Bom Fim', 'Rio Branco', 'Floresta',
          'São Geraldo', 'Navegantes', 'Farroupilha', 'Independência', 'Azenha',
          'Praia de Belas', 'Menino Deus', 'Cristal', 'Ipanema', 'Cavalhada',
          'Tristeza', 'Vila Assunção', 'Pedra Redonda', 'Belém Novo', 'Lami',
          'Moinhos de Vento', 'Mont\'Serrat', 'Auxiliadora', 'Petrópolis', 'Higienópolis',
          'Passo da Areia', 'São João', 'Partenon', 'Lomba do Pinheiro'
        ],
        'Curitiba': [
          'Centro', 'Batel', 'Água Verde', 'Rebouças', 'Bigorrilho', 'Mercês',
          'São Francisco', 'Alto da Glória', 'Cristo Rei', 'Jardim Botânico',
          'Cabral', 'Hugo Lange', 'Juvevê', 'Bacacheri', 'Boa Vista',
          'Ahú', 'São Lourenço', 'Portão', 'Novo Mundo', 'Pilarzinho',
          'Bom Retiro', 'Taboão', 'Vila Izabel', 'Parolin', 'Guaíra'
        ],
        'Petrópolis': [
          // Centro e Região Central
          'Centro', 'Alto da Serra', 'Bingen', 'Mosela', 'Carangola', 'Vila Felipe',
          'Castelânea', 'Cremerie', 'Valparaíso', 'Retiro', 'Duchas', 'Cascatinha',
          'Quitandinha', 'Nogueira', 'Corrêas', 'Itaipava', 'Pedro do Rio',
          'Posse', 'Araras', 'Secretário', 'Meio da Serra', 'Vila Imperial',
          'São Sebastião', 'Quarteirão Brasileiro', 'Quarteirão Italiano', 'Rua do Imperador',
          // Distritos
          'São Pedro', 'Vale da Boa Esperança', 'Taquara', 'Fazenda Inglesa',
          'Independência', 'Alcobacinha', 'Morin', 'Castrioto', 'Vale Florido',
          'Samambaia', 'Rocio', 'Jardim Salvador', 'Chácara Flora', 'Quarteirão Inglês'
        ],
        // Adicionando mais cidades importantes
        'Niterói': [
          'Icaraí', 'São Francisco', 'Charitas', 'Jurujuba', 'Ingá', 'Centro',
          'Fonseca', 'Santa Rosa', 'Viradouro', 'Barreto', 'Ilha da Conceição',
          'Ponta da Areia', 'Boa Viagem', 'Camboinhas', 'Piratininga', 'Jacaré',
          'São Lourenço', 'Várzea das Moças', 'Vital Brazil', 'Pendotiba',
          'Largo da Batalha', 'Santana', 'Cachoeiras', 'Sapê', 'Cantagalo',
          'Cubango', 'Morro do Estado', 'Cafubá', 'Itacoatiara', 'Engenho do Mato'
        ],
        'Campinas': [
          'Centro', 'Cambuí', 'Guanabara', 'Vila Nova', 'Jardim Chapadão',
          'Barão Geraldo', 'Cidade Universitária', 'Bosque', 'Taquaral', 'Nova Campinas',
          'Jardim Garcia', 'Vila Brandina', 'Jardim das Paineiras', 'Vila Marieta',
          'Jardim Proença', 'Jardim Santa Genebra', 'Mansões Santo Antônio',
          'Parque Taquaral', 'Jardim do Lago', 'Vila Olímpia', 'Jardim Flamboyant',
          'Cambará', 'Vila Industrial', 'Jardim Eulina', 'Vila Costa e Silva',
          'Jardim São Gabriel', 'Parque Industrial', 'Vila União', 'DIC I',
          'DIC II', 'DIC III', 'DIC IV', 'DIC V', 'DIC VI', 'Jardim Campos Elíseos'
        ],
        'Santos': [
          'Centro', 'Gonzaga', 'Boqueirão', 'Embaré', 'Aparecida', 'Ponta da Praia',
          'José Menino', 'Vila Belmiro', 'Vila Mathias', 'Encruzilhada', 'Campo Grande',
          'Macuco', 'Estuário', 'Valongo', 'Paquetá', 'Vila Nova', 'Pompéia',
          'Caneleira', 'Rádio Clube', 'Saboó', 'Alemoa', 'Chico de Paula',
          'Areia Branca', 'Bom Retiro', 'Jardim Castelo', 'Marapé', 'Jabaquara',
          'Monte Serrat', 'Morro José Menino', 'Morro da Penha', 'Morro Pacheco',
          'Morro Santa Terezinha', 'Morro São Bento', 'Morro Nova Cintra'
        ]
      };
      
      // Buscar bairros para a cidade específica
      const cityKey = Object.keys(neighborhoodsData).find(
        key => key.toLowerCase() === city.toLowerCase()
      );
      
      if (cityKey) {
        res.json(neighborhoodsData[cityKey]);
      } else {
        // Se não tiver dados locais, retornar uma lista genérica baseada no nome da cidade
        const genericNeighborhoods = [
          'Centro', 'Vila Nova', 'Jardim', 'São José', 'Santa Maria',
          'Boa Vista', 'Alto', 'Bairro Novo', 'Industrial', 'Residencial'
        ];
        res.json(genericNeighborhoods);
      }
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
      res.status(500).json({ message: "Failed to fetch neighborhoods" });
    }
  });

  // Endpoint para buscar áreas de serviço de um restaurante
  app.get("/api/service-areas/:restaurantId", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      
      const areas = await db
        .select()
        .from(serviceAreas)
        .where(eq(serviceAreas.restaurantId, restaurantId))
        .orderBy(serviceAreas.neighborhood);
      
      res.json(areas);
    } catch (error) {
      console.error("Error fetching service areas:", error);
      res.status(500).json({ message: "Failed to fetch service areas" });
    }
  });

  // Endpoint para criar nova área de serviço
  app.post("/api/service-areas", async (req, res) => {
    try {
      const serviceAreaData = insertServiceAreaSchema.parse(req.body);
      
      const [serviceArea] = await db
        .insert(serviceAreas)
        .values(serviceAreaData)
        .returning();
      
      res.json(serviceArea);
    } catch (error) {
      console.error("Error creating service area:", error);
      res.status(500).json({ message: "Failed to create service area" });
    }
  });

  // Endpoint para atualizar área de serviço
  app.put("/api/service-areas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const serviceAreaData = insertServiceAreaSchema.partial().parse(req.body);
      
      const [updatedArea] = await db
        .update(serviceAreas)
        .set(serviceAreaData)
        .where(eq(serviceAreas.id, id))
        .returning();
      
      if (!updatedArea) {
        return res.status(404).json({ message: "Service area not found" });
      }
      
      res.json(updatedArea);
    } catch (error) {
      console.error("Error updating service area:", error);
      res.status(500).json({ message: "Failed to update service area" });
    }
  });

  // Endpoint para remover área de serviço
  app.delete("/api/service-areas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [deletedArea] = await db
        .delete(serviceAreas)
        .where(eq(serviceAreas.id, id))
        .returning();
      
      if (!deletedArea) {
        return res.status(404).json({ message: "Service area not found" });
      }
      
      res.json({ message: "Service area deleted successfully" });
    } catch (error) {
      console.error("Error deleting service area:", error);
      res.status(500).json({ message: "Failed to delete service area" });
    }
  });

  // Endpoints para cupons
  app.get("/api/dev/coupons", async (req, res) => {
    try {
      // Buscar o restaurante do usuário de desenvolvimento
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const restaurantCoupons = await db
        .select()
        .from(coupons)
        .where(eq(coupons.restaurantId, restaurant.id))
        .orderBy(desc(coupons.createdAt));

      res.json(restaurantCoupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post("/api/dev/coupons", async (req, res) => {
    try {
      // Buscar o restaurante do usuário de desenvolvimento
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const couponData = insertCouponSchema.parse({
        ...req.body,
        restaurantId: restaurant.id,
      });

      const [coupon] = await db.insert(coupons).values(couponData).returning();
      res.json(coupon);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  // Atualizar cupom
  app.put("/api/dev/coupons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar o restaurante do usuário de desenvolvimento
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Verificar se o cupom pertence ao restaurante
      const [existingCoupon] = await db
        .select()
        .from(coupons)
        .where(and(
          eq(coupons.id, id),
          eq(coupons.restaurantId, restaurant.id)
        ))
        .limit(1);

      if (!existingCoupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const [updatedCoupon] = await db
        .update(coupons)
        .set(updateData)
        .where(eq(coupons.id, id))
        .returning();

      res.json(updatedCoupon);
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });

  // Deletar cupom
  app.delete("/api/dev/coupons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar o restaurante do usuário de desenvolvimento
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Verificar se o cupom pertence ao restaurante e deletar
      const [deletedCoupon] = await db
        .delete(coupons)
        .where(and(
          eq(coupons.id, id),
          eq(coupons.restaurantId, restaurant.id)
        ))
        .returning();

      if (!deletedCoupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }

      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });

  // Listar cupons públicos ativos de um restaurante (para exibir em destaque)
  app.get("/api/restaurants/:restaurantId/coupons", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      
      const now = new Date();
      const activeCoupons = await db
        .select({
          id: coupons.id,
          code: coupons.code,
          description: coupons.description,
          discountType: coupons.discountType,
          discountValue: coupons.discountValue,
          minOrderValue: coupons.minOrderValue,
          validUntil: coupons.validUntil
        })
        .from(coupons)
        .where(and(
          eq(coupons.restaurantId, restaurantId),
          eq(coupons.isActive, true),
          sql`${coupons.validFrom} <= ${now}`,
          sql`${coupons.validUntil} >= ${now}`,
          or(
            sql`${coupons.maxUses} IS NULL`,
            sql`${coupons.usedCount} < ${coupons.maxUses}`
          )
        ))
        .orderBy(desc(coupons.createdAt))
        .limit(5); // Mostrar apenas os 5 cupons mais recentes

      res.json(activeCoupons);
    } catch (error) {
      console.error("Error fetching public coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  // Endpoint para estatísticas do restaurante
  app.get("/api/restaurant/stats", async (req, res) => {
    try {
      // Buscar o restaurante do usuário de desenvolvimento
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, "dev-user-123"))
        .limit(1);
        
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Calcular estatísticas de pedidos
      const [totalOrdersResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.restaurantId, restaurant.id));

      const [totalRevenueResult] = await db
        .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
        .from(orders)
        .where(and(
          eq(orders.restaurantId, restaurant.id),
          sql`${orders.status} IN ('delivered', 'preparing', 'out_for_delivery')`
        ));

      const [todayOrdersResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(
          eq(orders.restaurantId, restaurant.id),
          sql`DATE(${orders.createdAt}) = CURRENT_DATE`
        ));

      const [pendingOrdersResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(
          eq(orders.restaurantId, restaurant.id),
          eq(orders.status, 'pending')
        ));

      // Estatísticas de produtos
      const [totalProductsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.restaurantId, restaurant.id));

      // Produto mais vendido - usando order_items
      const topProductsData = await db
        .select({
          productId: orderItems.productId,
          productName: products.name,
          totalSold: sql<number>`sum(${orderItems.quantity})`,
          totalRevenue: sql<number>`sum(${orderItems.totalPrice})`
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orders.restaurantId, restaurant.id))
        .groupBy(orderItems.productId, products.name)
        .orderBy(sql`sum(${orderItems.quantity}) DESC`)
        .limit(5);

      // Vendas por categoria
      const categoryStats = await db
        .select({
          category: categories.name,
          count: sql<number>`sum(${orderItems.quantity})`,
          revenue: sql<number>`sum(${orderItems.totalPrice})`
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(orders.restaurantId, restaurant.id),
          sql`${categories.name} IS NOT NULL`
        ))
        .groupBy(categories.name)
        .orderBy(sql`sum(${orderItems.totalPrice}) DESC`);

      // Vendas dos últimos 7 dias
      const salesByDay = await db
        .select({
          date: sql<string>`DATE(${orders.createdAt})`,
          sales: sql<number>`sum(${orders.total})`,
          orderCount: sql<number>`count(*)`
        })
        .from(orders)
        .where(and(
          eq(orders.restaurantId, restaurant.id),
          sql`${orders.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`
        ))
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt}) ASC`);

      const totalOrders = Number(totalOrdersResult?.count || 0);
      const totalRevenue = Number(totalRevenueResult?.total || 0);
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      res.json({
        totalOrders,
        totalRevenue,
        averageTicket,
        todayOrders: Number(todayOrdersResult?.count || 0),
        pendingOrders: Number(pendingOrdersResult?.count || 0),
        totalProducts: Number(totalProductsResult?.count || 0),
        topProducts: topProductsData,
        categoryStats: categoryStats,
        salesByDay: salesByDay.map(item => ({
          date: item.date,
          vendas: Number(item.sales || 0),
          pedidos: Number(item.orderCount || 0)
        }))
      });
    } catch (error) {
      console.error("Error fetching restaurant stats:", error);
      res.status(500).json({ message: "Failed to fetch restaurant stats" });
    }
  });

  // Validar cupom
  app.post("/api/validate-coupon", async (req, res) => {
    try {
      const { code, restaurantId, orderTotal } = req.body;
      
      if (!code || !restaurantId) {
        return res.status(400).json({ message: "Code and restaurant ID are required" });
      }

      const [coupon] = await db
        .select()
        .from(coupons)
        .where(and(
          eq(coupons.code, code.toUpperCase()),
          eq(coupons.restaurantId, restaurantId),
          eq(coupons.isActive, true)
        ))
        .limit(1);

      if (!coupon) {
        return res.status(404).json({ message: "Cupom não encontrado ou inválido" });
      }

      const now = new Date();
      if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
        return res.status(400).json({ message: "Cupom fora do período de validade" });
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ message: "Cupom esgotado" });
      }

      if (coupon.minOrderValue && orderTotal < parseFloat(coupon.minOrderValue)) {
        return res.status(400).json({ 
          message: `Valor mínimo do pedido deve ser R$ ${parseFloat(coupon.minOrderValue).toFixed(2)}` 
        });
      }

      // Calcular desconto
      let discount = 0;
      if (coupon.discountType === "percentage") {
        discount = orderTotal * (parseFloat(coupon.discountValue) / 100);
      } else {
        discount = parseFloat(coupon.discountValue);
      }

      res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        },
        discount: Math.min(discount, orderTotal) // Desconto não pode ser maior que o total
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Failed to validate coupon" });
    }
  });

  // Rota temporária para criar tabela de cupons
  app.post("/api/dev/create-coupon-tables", async (req, res) => {
    try {
      const { pool } = await import('./db');
      
      // Criar tabela de cupons se não existir
      await pool.query(`
        CREATE TABLE IF NOT EXISTS coupons (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          restaurant_id VARCHAR NOT NULL REFERENCES restaurants(id),
          code VARCHAR(50) NOT NULL,
          description VARCHAR(255),
          discount_type VARCHAR(20) NOT NULL,
          discount_value DECIMAL(10, 2) NOT NULL,
          min_order_value DECIMAL(10, 2),
          max_uses INTEGER,
          used_count INTEGER DEFAULT 0 NOT NULL,
          valid_from TIMESTAMP NOT NULL,
          valid_until TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      // Criar tabela de uso de cupons se não existir
      await pool.query(`
        CREATE TABLE IF NOT EXISTS coupon_usages (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          coupon_id VARCHAR NOT NULL REFERENCES coupons(id),
          order_id VARCHAR NOT NULL REFERENCES orders(id),
          discount_applied DECIMAL(10, 2) NOT NULL,
          used_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      res.json({ message: "Coupon tables created successfully" });
    } catch (error) {
      console.error("Error creating coupon tables:", error);
      res.status(500).json({ message: "Failed to create coupon tables", error: error instanceof Error ? error.message : String(error) });
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