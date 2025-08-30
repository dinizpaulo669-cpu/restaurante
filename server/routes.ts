import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertRestaurantSchema, insertProductSchema, insertOrderSchema, insertCategorySchema, insertAdditionalSchema, insertTableSchema, insertOpeningHoursSchema } from "@shared/schema";
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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
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
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
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
      // Usuário de desenvolvimento para testes
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
      // Processar dados do formulário usando restaurante de desenvolvimento
      const formData = {
        ...req.body,
        restaurantId: "dev-restaurant-123",
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
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        restaurantId: "dev-restaurant-123",
      });

      const category = await dbStorage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating dev category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.post('/api/update-role', isAuthenticated, async (req: any, res) => {
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

  app.post("/api/restaurants", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/my-restaurant", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Rota de desenvolvimento para restaurante de teste
  app.get("/api/dev/my-restaurant", async (req: any, res) => {
    try {
      const devRestaurant = {
        id: "dev-restaurant-123",
        ownerId: "dev-user-123",
        name: "Restaurante Teste",
        description: "Restaurante para testes de desenvolvimento",
        category: "italiana",
        address: "Rua Teste, 123 - Centro",
        phone: "(11) 99999-9999",
        email: "contato@restauranteteste.com",
        logoUrl: null,
        bannerUrl: null,
        rating: "4.5",
        deliveryFee: "5.00",
        minDeliveryTime: 20,
        maxDeliveryTime: 40,
        isActive: true,
        openingTime: "11:00",
        closingTime: "23:00",
        deliveryTime: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      res.json(devRestaurant);
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

  app.post("/api/products", isAuthenticated, upload.single('image'), async (req: any, res) => {
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

  app.put("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      const product = await dbStorage.updateProduct(req.params.id, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const category = await dbStorage.updateCategory(req.params.id, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/additionals", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/additionals/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/additionals/:id", isAuthenticated, async (req, res) => {
    try {
      await dbStorage.deleteAdditional(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting additional:", error);
      res.status(500).json({ message: "Failed to delete additional" });
    }
  });

  // Order routes
  app.get("/api/my-orders", isAuthenticated, async (req: any, res) => {
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
      const orderData = insertOrderSchema.parse(req.body);
      const order = await dbStorage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", isAuthenticated, async (req, res) => {
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

  app.post("/api/tables", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/tables/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const table = await dbStorage.updateTable(req.params.id, updates);
      res.json(table);
    } catch (error) {
      console.error("Error updating table:", error);
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  app.delete("/api/tables/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/opening-hours", isAuthenticated, async (req: any, res) => {
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
    app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
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
    app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
      res.status(503).json({ 
        message: "Payment system not configured. Please contact support." 
      });
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
