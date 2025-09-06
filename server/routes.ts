import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage as dbStorage } from "./storage";
import { setupAuth, isDevAuthenticated } from "./replitAuth";
import { insertRestaurantSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema, insertCategorySchema, insertAdditionalSchema, insertTableSchema, insertOpeningHoursSchema } from "@shared/schema";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

// Configuração do multer para upload de imagens
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determinar diretório baseado no tipo de upload
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
  // Servir arquivos estáticos para uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Rota de desenvolvimento para bypass de autenticação
  app.get('/api/dev/auth/user', async (req: any, res) => {
    try {
      // Verificar se há usuário na sessão (do login interno)
      if (req.session.user) {
        return res.json(req.session.user);
      }
      
      // Usuário de desenvolvimento padrão para testes
      const devUser = {
        id: "dev-user-123",
        email: "test@restaurant.com",
        firstName: "Usuário",
        lastName: "Teste",
        role: "restaurant_owner",
        subscriptionPlan: "pro",
        isTrialActive: true,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        createdAt: new Date(),
        updatedAt: new Date()
      };
      res.json(devUser);
    } catch (error) {
      console.error("Error fetching dev user:", error);
      res.status(500).json({ message: "Failed to fetch dev user" });
    }
  });

  // Rota de desenvolvimento para criar produtos sem autenticação
  app.post("/api/dev/products", upload.single('image'), async (req: any, res) => {
    try {
      // Buscar o restaurante do usuário de desenvolvimento
      const restaurant = await dbStorage.getRestaurantByOwner("dev-user-123");
      if (!restaurant) {
        return res.status(404).json({ message: "Dev restaurant not found" });
      }

      // Processar dados do formulário usando restaurante real
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
      const product = await dbStorage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating dev product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Rota de desenvolvimento para criar categorias sem autenticação
  app.post("/api/dev/categories", async (req: any, res) => {
    try {
      // Buscar o restaurante do usuário de desenvolvimento
      const restaurant = await dbStorage.getRestaurantByOwner("dev-user-123");
      if (!restaurant) {
        return res.status(404).json({ message: "Dev restaurant not found" });
      }

      const categoryData = insertCategorySchema.parse({
        ...req.body,
        restaurantId: restaurant.id,
      });

      const category = await dbStorage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating dev category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Login interno simplificado para desenvolvimento
  app.post('/api/internal-login', async (req: any, res) => {
    try {
      const { email, password, userType } = req.body;
      
      if (!email || !password || !userType) {
        return res.status(400).json({ message: "Email, senha e tipo de usuário são obrigatórios" });
      }

      // Simulação de autenticação (em produção seria validação real)
      if (process.env.NODE_ENV === "development") {
        // Para desenvolvimento, aceitar qualquer email/senha
        const devUser = {
          id: "dev-user-internal",
          email: email,
          firstName: "Usuário",
          lastName: "Logado",
          role: userType,
          subscriptionPlan: userType === "customer" ? null : "pro",
          isTrialActive: userType === "restaurant_owner",
          trialEndsAt: userType === "restaurant_owner" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Salvar/atualizar usuário no banco
        await dbStorage.upsertUser({
          id: devUser.id,
          email: devUser.email,
          firstName: devUser.firstName,
          lastName: devUser.lastName,
          role: devUser.role,
          subscriptionPlan: devUser.subscriptionPlan,
          isTrialActive: devUser.isTrialActive,
          trialEndsAt: devUser.trialEndsAt,
        });

        // Simular sessão (em produção seria através do Passport)
        req.session.user = devUser;
        
        res.json({ 
          message: "Login realizado com sucesso",
          user: devUser 
        });
      } else {
        // Em produção, implementar validação real
        res.status(401).json({ message: "Credenciais inválidas" });
      }
    } catch (error) {
      console.error("Error in internal login:", error);
      res.status(500).json({ message: "Erro interno no login" });
    }
  });

  app.post('/api/update-role', isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!role || !['customer', 'restaurant_owner'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await dbStorage.upsertUser({
        id: userId,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        role: role,
        subscriptionPlan: role === "customer" ? null : "trial",
        trialEndsAt: role === "customer" ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isTrialActive: role === "restaurant_owner",
      });

      const user = await dbStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Restaurant routes
  app.get("/api/restaurants", async (req, res) => {
    try {
      const { search, category, limit } = req.query;
      const restaurants = await dbStorage.getRestaurants(
        search as string,
        category as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const restaurant = await dbStorage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post("/api/restaurants", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurantData = insertRestaurantSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      // Update user role to restaurant_owner
      await dbStorage.upsertUser({
        id: userId,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        role: "restaurant_owner",
      });

      const restaurant = await dbStorage.createRestaurant(restaurantData);
      res.json(restaurant);
    } catch (error) {
      console.error("Error creating restaurant:", error);
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  app.get("/api/my-restaurant", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Primeiro verifica se o usuário existe no banco
      let user = await dbStorage.getUser(userId);
      if (!user) {
        // Se o usuário não existe no banco, cria ele
        const userData = {
          id: userId,
          email: req.user.claims.email || "",
          firstName: req.user.claims.firstName || "",
          lastName: req.user.claims.lastName || "",
          role: "restaurant_owner",
          subscriptionPlan: "basic",
          isTrialActive: true,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        };
        
        user = await dbStorage.upsertUser(userData);
      }
      
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching user restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  // Função para criar/buscar usuário e restaurante de desenvolvimento
  async function ensureDevData() {
    try {
      // Primeiro garante que o usuário de desenvolvimento existe
      let user = await dbStorage.getUser("dev-user-123");
      
      if (!user) {
        // Cria o usuário de desenvolvimento
        const devUserData = {
          id: "dev-user-123",
          email: "test@restaurant.com",
          firstName: "Usuário",
          lastName: "Teste",
          role: "restaurant_owner",
          subscriptionPlan: "pro",
          isTrialActive: true,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        };
        
        user = await dbStorage.upsertUser(devUserData);
      }
      
      // Depois garante que o restaurante de desenvolvimento existe
      let restaurant = await dbStorage.getRestaurantByOwner("dev-user-123");
      
      if (!restaurant) {
        // Se não existir, cria o restaurante de desenvolvimento
        const devRestaurantData = {
          ownerId: "dev-user-123",
          name: "Restaurante Teste",
          description: "Restaurante para testes de desenvolvimento",
          category: "italiana",
          address: "Rua Teste, 123 - Centro",
          phone: "(11) 99999-9999",
          email: "contato@restauranteteste.com",
          rating: "4.5",
          deliveryFee: "5.00",
          minDeliveryTime: 20,
          maxDeliveryTime: 40,
          isActive: true,
          openingTime: "11:00",
          closingTime: "23:00",
          deliveryTime: 30
        };
        
        restaurant = await dbStorage.createRestaurant(devRestaurantData);
      }
      
      return { user, restaurant };
    } catch (error) {
      console.error("Error ensuring dev data:", error);
      throw error;
    }
  }

  // Rota de desenvolvimento para restaurante de teste
  app.get("/api/dev/my-restaurant", async (req: any, res) => {
    try {
      const { restaurant } = await ensureDevData();
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching dev restaurant:", error);
      res.status(500).json({ message: "Failed to fetch dev restaurant" });
    }
  });

  // Product routes
  app.get("/api/restaurants/:id/products", async (req, res) => {
    try {
      const products = await dbStorage.getProducts(req.params.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", isDevAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
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
      const product = await dbStorage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", isDevAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      const product = await dbStorage.updateProduct(req.params.id, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isDevAuthenticated, async (req, res) => {
    try {
      await dbStorage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Category routes
  app.get("/api/restaurants/:id/categories", async (req, res) => {
    try {
      const categories = await dbStorage.getCategories(req.params.id);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const categoryData = insertCategorySchema.parse({
        ...req.body,
        restaurantId: restaurant.id,
      });

      const category = await dbStorage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", isDevAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const category = await dbStorage.updateCategory(req.params.id, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isDevAuthenticated, async (req, res) => {
    try {
      await dbStorage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Additional routes
  app.get("/api/restaurants/:id/additionals", async (req, res) => {
    try {
      const additionals = await dbStorage.getAdditionals(req.params.id);
      res.json(additionals);
    } catch (error) {
      console.error("Error fetching additionals:", error);
      res.status(500).json({ message: "Failed to fetch additionals" });
    }
  });

  app.post("/api/additionals", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const additionalData = insertAdditionalSchema.parse({
        ...req.body,
        restaurantId: restaurant.id,
        price: parseFloat(req.body.price),
        costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : undefined,
        stock: parseInt(req.body.stock) || 0,
      });

      const additional = await dbStorage.createAdditional(additionalData);
      res.json(additional);
    } catch (error) {
      console.error("Error creating additional:", error);
      res.status(500).json({ message: "Failed to create additional" });
    }
  });

  app.put("/api/additionals/:id", isDevAuthenticated, async (req, res) => {
    try {
      const updates = {
        ...req.body,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : undefined,
        stock: req.body.stock ? parseInt(req.body.stock) : undefined,
      };
      const additional = await dbStorage.updateAdditional(req.params.id, updates);
      res.json(additional);
    } catch (error) {
      console.error("Error updating additional:", error);
      res.status(500).json({ message: "Failed to update additional" });
    }
  });

  app.delete("/api/additionals/:id", isDevAuthenticated, async (req, res) => {
    try {
      await dbStorage.deleteAdditional(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting additional:", error);
      res.status(500).json({ message: "Failed to delete additional" });
    }
  });

  // Order routes
  app.get("/api/my-orders", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const orders = await dbStorage.getOrders(restaurant.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const validatedOrderData = insertOrderSchema.parse(orderData);
      const order = await dbStorage.createOrder(validatedOrderData);
      
      // Save order items if provided
      if (items && items.length > 0) {
        await dbStorage.createOrderItems(items, order.id);
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", isDevAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await dbStorage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Table routes
  app.get("/api/restaurants/:id/tables", async (req, res) => {
    try {
      const tables = await dbStorage.getTables(req.params.id);
      res.json(tables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.post("/api/tables", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
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

      const table = await dbStorage.createTable(tableData);
      res.json(table);
    } catch (error) {
      console.error("Error creating table:", error);
      res.status(500).json({ message: "Failed to create table" });
    }
  });

  app.put("/api/tables/:id", isDevAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const table = await dbStorage.updateTable(req.params.id, updates);
      res.json(table);
    } catch (error) {
      console.error("Error updating table:", error);
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  app.delete("/api/tables/:id", isDevAuthenticated, async (req, res) => {
    try {
      await dbStorage.deleteTable(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting table:", error);
      res.status(500).json({ message: "Failed to delete table" });
    }
  });

  // Get table by QR code (for customer access)
  app.get("/api/tables/qr/:qrCode", async (req, res) => {
    try {
      const table = await dbStorage.getTableByQrCode(req.params.qrCode);
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
      const { restaurant } = await ensureDevData();
      const tables = await dbStorage.getTables(restaurant.id);
      res.json(tables);
    } catch (error) {
      console.error("Error fetching dev tables:", error);
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.post("/api/dev/tables", async (req, res) => {
    try {
      // Garantir que o usuário e restaurante de desenvolvimento existem
      const { restaurant } = await ensureDevData();
      
      // Generate unique QR code
      const qrCode = `table-${restaurant.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const tableData = insertTableSchema.parse({
        ...req.body,
        restaurantId: restaurant.id,
        qrCode,
      });

      const table = await dbStorage.createTable(tableData);
      res.json(table);
    } catch (error) {
      console.error("Error creating dev table:", error);
      res.status(500).json({ message: "Failed to create table" });
    }
  });

  app.put("/api/dev/tables/:id", async (req, res) => {
    try {
      const updates = req.body;
      const table = await dbStorage.updateTable(req.params.id, updates);
      res.json(table);
    } catch (error) {
      console.error("Error updating dev table:", error);
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  app.delete("/api/dev/tables/:id", async (req, res) => {
    try {
      await dbStorage.deleteTable(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dev table:", error);
      res.status(500).json({ message: "Failed to delete table" });
    }
  });

  // Upload de logo e banner do restaurante
  app.post("/api/restaurants/:id/logo", isDevAuthenticated, upload.single('logo'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant || restaurant.id !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const logoUrl = `/uploads/restaurant/${req.file.filename}`;
      const updatedRestaurant = await dbStorage.updateRestaurant(req.params.id, { logoUrl });
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  app.post("/api/restaurants/:id/banner", isDevAuthenticated, upload.single('banner'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant || restaurant.id !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const bannerUrl = `/uploads/restaurant/${req.file.filename}`;
      const updatedRestaurant = await dbStorage.updateRestaurant(req.params.id, { bannerUrl });
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error uploading banner:", error);
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });

  // Rotas de desenvolvimento para upload
  app.post("/api/dev/restaurants/logo", upload.single('logo'), async (req: any, res) => {
    try {
      const { restaurant } = await ensureDevData();

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const logoUrl = `/uploads/restaurant/${req.file.filename}`;
      const updatedRestaurant = await dbStorage.updateRestaurant(restaurant.id, { logoUrl });
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error uploading dev logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  app.post("/api/dev/restaurants/banner", upload.single('banner'), async (req: any, res) => {
    try {
      const { restaurant } = await ensureDevData();

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const bannerUrl = `/uploads/restaurant/${req.file.filename}`;
      const updatedRestaurant = await dbStorage.updateRestaurant(restaurant.id, { bannerUrl });
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error uploading dev banner:", error);
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });

  // Rotas para atualizar informações do restaurante
  app.put("/api/restaurants/:id/about", isDevAuthenticated, async (req: any, res) => {
    try {
      const { description } = req.body;
      const restaurantId = req.params.id;
      
      const restaurant = await dbStorage.updateRestaurant(restaurantId, {
        description: description
      });
      
      res.json(restaurant);
    } catch (error) {
      console.error("Error updating restaurant description:", error);
      res.status(500).json({ message: "Failed to update description" });
    }
  });

  app.put("/api/restaurants/:id/logo", isDevAuthenticated, async (req: any, res) => {
    try {
      const { logoUrl } = req.body;
      const restaurantId = req.params.id;
      
      const restaurant = await dbStorage.updateRestaurant(restaurantId, {
        logoUrl: logoUrl
      });
      
      res.json(restaurant);
    } catch (error) {
      console.error("Error updating restaurant logo:", error);
      res.status(500).json({ message: "Failed to update logo" });
    }
  });

  app.put("/api/restaurants/:id/banner", isDevAuthenticated, async (req: any, res) => {
    try {
      const { bannerUrl } = req.body;
      const restaurantId = req.params.id;
      
      const restaurant = await dbStorage.updateRestaurant(restaurantId, {
        bannerUrl: bannerUrl
      });
      
      res.json(restaurant);
    } catch (error) {
      console.error("Error updating restaurant banner:", error);
      res.status(500).json({ message: "Failed to update banner" });
    }
  });

  // Rotas de desenvolvimento para atualizar informações do restaurante
  app.put("/api/dev/restaurant/about", async (req, res) => {
    try {
      const { description } = req.body;
      const { restaurant } = await ensureDevData();
      
      const updatedRestaurant = await dbStorage.updateRestaurant(restaurant.id, {
        description: description
      });
      
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating dev restaurant description:", error);
      res.status(500).json({ message: "Failed to update description" });
    }
  });

  app.put("/api/dev/restaurant/logo", async (req, res) => {
    try {
      const { logoUrl } = req.body;
      const { restaurant } = await ensureDevData();
      
      const updatedRestaurant = await dbStorage.updateRestaurant(restaurant.id, {
        logoUrl: logoUrl
      });
      
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating dev restaurant logo:", error);
      res.status(500).json({ message: "Failed to update logo" });
    }
  });

  app.put("/api/dev/restaurant/banner", async (req, res) => {
    try {
      const { bannerUrl } = req.body;
      const { restaurant } = await ensureDevData();
      
      const updatedRestaurant = await dbStorage.updateRestaurant(restaurant.id, {
        bannerUrl: bannerUrl
      });
      
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating dev restaurant banner:", error);
      res.status(500).json({ message: "Failed to update banner" });
    }
  });

  // Rota para editar dados da empresa
  app.put("/api/restaurants/:id/company-data", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant || restaurant.id !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = req.body;
      const updatedRestaurant = await dbStorage.updateRestaurant(req.params.id, updates);
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating company data:", error);
      res.status(500).json({ message: "Failed to update company data" });
    }
  });

  app.put("/api/dev/restaurant/company-data", async (req, res) => {
    try {
      const { restaurant } = await ensureDevData();
      const updates = req.body;
      
      const updatedRestaurant = await dbStorage.updateRestaurant(restaurant.id, updates);
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating dev company data:", error);
      res.status(500).json({ message: "Failed to update company data" });
    }
  });

  // Rota para configurar WhatsApp
  app.put("/api/restaurants/:id/whatsapp", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant || restaurant.id !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { whatsappNumber } = req.body;
      const updatedRestaurant = await dbStorage.updateRestaurant(req.params.id, { whatsappNumber });
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating WhatsApp number:", error);
      res.status(500).json({ message: "Failed to update WhatsApp number" });
    }
  });

  app.put("/api/dev/restaurant/whatsapp", async (req, res) => {
    try {
      const { restaurant } = await ensureDevData();
      const { whatsappNumber } = req.body;
      
      const updatedRestaurant = await dbStorage.updateRestaurant(restaurant.id, { whatsappNumber });
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating dev WhatsApp number:", error);
      res.status(500).json({ message: "Failed to update WhatsApp number" });
    }
  });

  // Opening hours routes
  app.get("/api/restaurants/:id/opening-hours", async (req, res) => {
    try {
      const openingHours = await dbStorage.getOpeningHours(req.params.id);
      res.json(openingHours);
    } catch (error) {
      console.error("Error fetching opening hours:", error);
      res.status(500).json({ message: "Failed to fetch opening hours" });
    }
  });

  app.post("/api/opening-hours", isDevAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const restaurant = await dbStorage.getRestaurantByOwner(userId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const { hours } = req.body; // Array of opening hours
      const hoursWithRestaurantId = hours.map((hour: any) => ({
        ...hour,
        restaurantId: restaurant.id,
      }));

      const openingHours = await dbStorage.upsertOpeningHours(restaurant.id, hoursWithRestaurantId);
      res.json(openingHours);
    } catch (error) {
      console.error("Error saving opening hours:", error);
      res.status(500).json({ message: "Failed to save opening hours" });
    }
  });

  // Subscription routes (only if Stripe is configured)
  if (stripe) {
    app.post('/api/create-subscription', isDevAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { priceId } = req.body;

        let user = await dbStorage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.stripeSubscriptionId) {
          const subscription = await stripe!.subscriptions.retrieve(user.stripeSubscriptionId);
          const invoice = subscription.latest_invoice;
          const clientSecret = typeof invoice === 'object' && invoice?.payment_intent ? 
            (typeof invoice.payment_intent === 'object' ? invoice.payment_intent.client_secret : null) : null;
          
          return res.json({
            subscriptionId: subscription.id,
            clientSecret,
          });
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe!.customers.create({
            email: user.email || undefined,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
          });
          customerId = customer.id;
          user = await dbStorage.updateUserStripeInfo(userId, customerId);
        }

        const subscription = await stripe!.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await dbStorage.updateUserStripeInfo(userId, customerId, subscription.id);

        const invoice = subscription.latest_invoice;
        const clientSecret = typeof invoice === 'object' && invoice?.payment_intent ? 
          (typeof invoice.payment_intent === 'object' ? invoice.payment_intent.client_secret : null) : null;

        res.json({
          subscriptionId: subscription.id,
          clientSecret,
        });
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        res.status(400).json({ error: { message: error.message } });
      }
    });
  } else {
    // Fallback when Stripe is not configured
    app.post('/api/create-subscription', isDevAuthenticated, async (req: any, res) => {
      res.status(503).json({ 
        message: "Payment system not configured. Please contact support." 
      });
    });
  }

  // Rotas para funcionários
  app.post("/api/employees", async (req: any, res) => {
    try {
      const { name, email, password, permissions, restaurantId } = req.body;
      
      const employeeData = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        email,
        password, // Em produção seria necessário hash
        restaurantId,
        permissions,
        role: "employee" as const
      };
      
      const employee = await dbStorage.createEmployee(employeeData);
      res.json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.get("/api/employees/:restaurantId", async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const employees = await dbStorage.getEmployees(restaurantId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Rotas para áreas de atendimento
  app.post("/api/service-areas", async (req: any, res) => {
    try {
      const { neighborhood, city, state, deliveryFee, restaurantId } = req.body;
      
      const areaData = {
        restaurantId,
        neighborhood,
        city,
        state,
        deliveryFee: deliveryFee,
        isActive: true
      };
      
      const area = await dbStorage.createServiceArea(areaData);
      res.json(area);
    } catch (error) {
      console.error("Error creating service area:", error);
      res.status(500).json({ message: "Failed to create service area" });
    }
  });

  app.get("/api/service-areas/:restaurantId", async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const areas = await dbStorage.getServiceAreas(restaurantId);
      res.json(areas);
    } catch (error) {
      console.error("Error fetching service areas:", error);
      res.status(500).json({ message: "Failed to fetch service areas" });
    }
  });

  app.get("/api/neighborhoods/:city/:state", async (req: any, res) => {
    try {
      const { city, state } = req.params;
      const neighborhoods = await dbStorage.getCityNeighborhoods(city, state);
      res.json(neighborhoods);
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
      res.status(500).json({ message: "Failed to fetch neighborhoods" });
    }
  });

  app.put("/api/service-areas/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const area = await dbStorage.updateServiceArea(id, updates);
      res.json(area);
    } catch (error) {
      console.error("Error updating service area:", error);
      res.status(500).json({ message: "Failed to update service area" });
    }
  });

  app.delete("/api/service-areas/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      await dbStorage.deleteServiceArea(id);
      res.json({ message: "Service area deleted successfully" });
    } catch (error) {
      console.error("Error deleting service area:", error);
      res.status(500).json({ message: "Failed to delete service area" });
    }
  });

  // Rotas para integração com IBGE
  app.get("/api/ibge/states", async (req: any, res) => {
    try {
      const states = await dbStorage.getStates();
      res.json(states);
    } catch (error) {
      console.error("Error fetching states from IBGE:", error);
      res.status(500).json({ message: "Failed to fetch states" });
    }
  });

  app.get("/api/ibge/municipalities/:stateId", async (req: any, res) => {
    try {
      const { stateId } = req.params;
      const municipalities = await dbStorage.getMunicipalities(parseInt(stateId));
      res.json(municipalities);
    } catch (error) {
      console.error("Error fetching municipalities from IBGE:", error);
      res.status(500).json({ message: "Failed to fetch municipalities" });
    }
  });

  app.get("/api/ibge/districts/:municipalityId", async (req: any, res) => {
    try {
      const { municipalityId } = req.params;
      const districts = await dbStorage.getDistricts(parseInt(municipalityId));
      res.json(districts);
    } catch (error) {
      console.error("Error fetching districts from IBGE:", error);
      res.status(500).json({ message: "Failed to fetch districts" });
    }
  });

  app.get("/api/ibge/municipality/:cityName/:stateCode", async (req: any, res) => {
    try {
      const { cityName, stateCode } = req.params;
      const municipalityId = await dbStorage.findMunicipalityByName(cityName, stateCode);
      res.json({ municipalityId });
    } catch (error) {
      console.error("Error finding municipality:", error);
      res.status(500).json({ message: "Failed to find municipality" });
    }
  });

  // Customer panel APIs
  app.get("/api/customer/favorites", async (req, res) => {
    try {
      // Para desenvolvimento, usar sessão interna ou user padrão
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      const favorites = await dbStorage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/customer/favorites/:restaurantId", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      const favorite = await dbStorage.addToFavorites(userId, req.params.restaurantId);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/customer/favorites/:restaurantId", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      await dbStorage.removeFromFavorites(userId, req.params.restaurantId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/customer/orders", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      const orders = await dbStorage.getCustomerOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/customer/stats", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      const stats = await dbStorage.getCustomerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/customer/profile", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/customer/profile", async (req, res) => {
    try {
      let userId = "dev-user-internal";
      let isNewRegistration = false;
      
      // Se não há sessão ativa, é um novo cadastro
      if (!req.session?.user?.id) {
        isNewRegistration = true;
      } else {
        userId = req.session.user.id;
      }
      
      const updates = req.body;
      
      // Para novos cadastros, definir role como customer
      const userData = {
        id: userId,
        ...updates,
        role: "customer",
      };
      
      const user = await dbStorage.upsertUser(userData);
      
      // Se é um novo cadastro, criar sessão de autenticação
      if (isNewRegistration) {
        req.session.user = {
          id: userId,
          email: updates.firstName ? `${updates.firstName}@cliente.com` : "cliente@exemplo.com",
          firstName: updates.firstName || "Cliente",
          lastName: updates.lastName || "",
          role: "customer",
          subscriptionPlan: null,
          isTrialActive: false,
          trialEndsAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // APIs de Mensagens de Pedidos
  
  // Buscar mensagens de um pedido
  app.get("/api/orders/:orderId/messages", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Verificar se o pedido existe e se o usuário tem acesso
      const order = await dbStorage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      let userId = "dev-user-internal";
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      // Verificar acesso: deve ser o cliente do pedido ou dono do restaurante
      const restaurant = await dbStorage.getRestaurant(order.restaurantId);
      const isCustomer = order.customerId === userId;
      const isRestaurantOwner = restaurant?.ownerId === userId;
      
      if (!isCustomer && !isRestaurantOwner) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const messages = await dbStorage.getOrderMessages(orderId);
      
      // Marcar mensagens como lidas se for o destinatário
      const userType = isCustomer ? "customer" : "restaurant";
      await dbStorage.markMessagesAsRead(orderId, userType);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching order messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Enviar nova mensagem
  app.post("/api/orders/:orderId/messages", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { message } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Mensagem é obrigatória" });
      }
      
      // Verificar se o pedido existe
      const order = await dbStorage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      let userId = "dev-user-internal";
      let userType = "customer";
      
      if (req.session?.user?.id) {
        userId = req.session.user.id;
        
        // Verificar acesso e determinar tipo de usuário
        const restaurant = await dbStorage.getRestaurant(order.restaurantId);
        const isCustomer = order.customerId === userId;
        const isRestaurantOwner = restaurant?.ownerId === userId;
        
        if (!isCustomer && !isRestaurantOwner) {
          return res.status(403).json({ message: "Acesso negado" });
        }
        
        userType = isCustomer ? "customer" : "restaurant";
      }
      
      const newMessage = await dbStorage.createOrderMessage({
        orderId,
        senderId: userId,
        senderType: userType,
        message: message.trim(),
      });
      
      // Broadcast da nova mensagem para todos conectados ao pedido
      const broadcast = (global as any).websocketBroadcast;
      if (broadcast) {
        broadcast.broadcastToOrder(orderId, {
          type: 'new_message',
          message: newMessage
        });
      }
      
      res.json(newMessage);
    } catch (error) {
      console.error("Error creating order message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // APIs de Status de Pedidos
  
  // Atualizar status do pedido (apenas restaurante)
  app.put("/api/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      
      // Verificar se o pedido existe
      const order = await dbStorage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      let userId = "dev-user-123"; // Usuário padrão de desenvolvimento para restaurante
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      // Verificar se é o dono do restaurante
      const restaurant = await dbStorage.getRestaurant(order.restaurantId);
      if (restaurant?.ownerId !== userId) {
        return res.status(403).json({ message: "Apenas o restaurante pode alterar o status" });
      }
      
      // Atualizar status
      const updatedOrder = await dbStorage.updateOrderStatus(orderId, status);
      
      // Se foi entregue, salvar timestamp
      if (status === "delivered") {
        await dbStorage.updateOrder(orderId, { deliveredAt: new Date() });
      }
      
      // Broadcast da atualização de status para todos conectados ao pedido
      const broadcast = (global as any).websocketBroadcast;
      if (broadcast) {
        broadcast.broadcastToOrder(orderId, {
          type: 'status_updated',
          orderId,
          status,
          order: updatedOrder
        });
        
        // Também notificar cliente especificamente
        if (updatedOrder.customerId) {
          broadcast.broadcastToCustomer(updatedOrder.customerId, {
            type: 'order_status_updated',
            orderId,
            status,
            order: updatedOrder
          });
        }
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  const httpServer = createServer(app);
  
  // Configurar WebSocket server na rota /ws
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Armazenar conexões por tipo de usuário e ID
  const connections = new Map<string, { ws: WebSocket, userId?: string, userType?: string }>();
  
  wss.on('connection', (ws, req) => {
    const connectionId = Math.random().toString(36).substr(2, 9);
    connections.set(connectionId, { ws });
    
    console.log(`Nova conexão WebSocket: ${connectionId}`);
    
    // Enviar mensagem de confirmação de conexão
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        connectionId
      }));
    }
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Autenticação da conexão
        if (message.type === 'authenticate') {
          const connection = connections.get(connectionId);
          if (connection) {
            connection.userId = message.userId;
            connection.userType = message.userType; // 'customer' ou 'restaurant'
            connections.set(connectionId, connection);
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'authenticated',
                userId: message.userId,
                userType: message.userType
              }));
            }
          }
        }
        
        // Juntar-se a sala de pedido específico
        if (message.type === 'join_order') {
          const connection = connections.get(connectionId);
          if (connection) {
            connection.orderId = message.orderId;
            connections.set(connectionId, connection);
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'joined_order',
                orderId: message.orderId
              }));
            }
          }
        }
        
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });
    
    ws.on('close', () => {
      connections.delete(connectionId);
      console.log(`Conexão WebSocket fechada: ${connectionId}`);
    });
    
    ws.on('error', (error) => {
      console.error('Erro WebSocket:', error);
      connections.delete(connectionId);
    });
  });
  
  // Função para broadcast de atualizações
  const broadcastToOrder = (orderId: string, data: any) => {
    connections.forEach((connection, id) => {
      if (connection.orderId === orderId && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(data));
      }
    });
  };
  
  const broadcastToRestaurant = (restaurantId: string, data: any) => {
    connections.forEach((connection, id) => {
      if (connection.userType === 'restaurant' && 
          connection.restaurantId === restaurantId && 
          connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(data));
      }
    });
  };
  
  const broadcastToCustomer = (customerId: string, data: any) => {
    connections.forEach((connection, id) => {
      if (connection.userType === 'customer' && 
          connection.userId === customerId && 
          connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(data));
      }
    });
  };
  
  // Tornar as funções de broadcast disponíveis globalmente para uso nas APIs
  (global as any).websocketBroadcast = {
    broadcastToOrder,
    broadcastToRestaurant,
    broadcastToCustomer
  };
  
  return httpServer;
}
