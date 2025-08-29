import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertRestaurantSchema, insertProductSchema, insertOrderSchema, insertCategorySchema, insertAdditionalSchema } from "@shared/schema";
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
