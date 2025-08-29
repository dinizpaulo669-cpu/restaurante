import {
  users,
  restaurants,
  products,
  categories,
  orders,
  orderItems,
  additionals,
  productVariations,
  type User,
  type UpsertUser,
  type Restaurant,
  type InsertRestaurant,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Order,
  type InsertOrder,
  type OrderItem,
  type Additional,
  type InsertAdditional,
  type ProductVariation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  checkTrialStatus(userId: string): Promise<boolean>;
  
  // Restaurant operations
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantByOwner(ownerId: string): Promise<Restaurant | undefined>;
  getRestaurants(search?: string, category?: string, limit?: number): Promise<Restaurant[]>;
  updateRestaurant(id: string, updates: Partial<InsertRestaurant>): Promise<Restaurant>;
  
  // Product operations
  getProducts(restaurantId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Category operations
  getCategories(restaurantId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Order operations
  getOrders(restaurantId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: string, status: string): Promise<Order>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  
  // Additional operations
  getAdditionals(restaurantId: string): Promise<Additional[]>;
  createAdditional(additional: InsertAdditional): Promise<Additional>;
  updateAdditional(id: string, updates: Partial<InsertAdditional>): Promise<Additional>;
  deleteAdditional(id: string): Promise<void>;
  
  // Variations operations
  getProductVariations(productId: string): Promise<ProductVariation[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  async checkTrialStatus(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.isTrialActive || !user.trialEndsAt) {
      return false;
    }
    
    const now = new Date();
    const trialEnd = new Date(user.trialEndsAt);
    
    if (now > trialEnd) {
      // Trial expired, update status
      await db
        .update(users)
        .set({ isTrialActive: false, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return false;
    }
    
    return true;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const updates: any = { stripeCustomerId, updatedAt: new Date() };
    if (stripeSubscriptionId) {
      updates.stripeSubscriptionId = stripeSubscriptionId;
    }
    
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Restaurant operations
  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurant)
      .returning();
    return newRestaurant;
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantByOwner(ownerId: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, ownerId));
    return restaurant;
  }

  async getRestaurants(search?: string, category?: string, limit = 20): Promise<Restaurant[]> {
    const conditions = [eq(restaurants.isActive, true)];
    
    if (search) {
      conditions.push(ilike(restaurants.name, `%${search}%`));
    }
    
    if (category) {
      conditions.push(eq(restaurants.category, category));
    }
    
    return await db
      .select()
      .from(restaurants)
      .where(and(...conditions))
      .limit(limit)
      .orderBy(desc(restaurants.rating));
  }

  async updateRestaurant(id: string, updates: Partial<InsertRestaurant>): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
    return restaurant;
  }

  // Product operations
  async getProducts(restaurantId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.restaurantId, restaurantId))
      .orderBy(products.sortOrder);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Category operations
  async getCategories(restaurantId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, restaurantId))
      .orderBy(categories.sortOrder);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Order operations
  async getOrders(restaurantId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.restaurantId, restaurantId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Get next order number for the restaurant
    const [lastOrder] = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(eq(orders.restaurantId, order.restaurantId))
      .orderBy(desc(orders.orderNumber))
      .limit(1);

    const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

    const [newOrder] = await db
      .insert(orders)
      .values({ ...order, orderNumber: nextOrderNumber })
      .returning();
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const updates: any = { status, updatedAt: new Date() };
    if (status === "delivered") {
      updates.deliveredAt = new Date();
    }

    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  // Additional operations
  async getAdditionals(restaurantId: string): Promise<Additional[]> {
    return await db
      .select()
      .from(additionals)
      .where(eq(additionals.restaurantId, restaurantId))
      .orderBy(additionals.name);
  }

  async createAdditional(additional: InsertAdditional): Promise<Additional> {
    const [newAdditional] = await db
      .insert(additionals)
      .values(additional)
      .returning();
    return newAdditional;
  }

  async updateAdditional(id: string, updates: Partial<InsertAdditional>): Promise<Additional> {
    const [additional] = await db
      .update(additionals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(additionals.id, id))
      .returning();
    return additional;
  }

  async deleteAdditional(id: string): Promise<void> {
    await db.delete(additionals).where(eq(additionals.id, id));
  }

  // Variations operations
  async getProductVariations(productId: string): Promise<ProductVariation[]> {
    return await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.productId, productId));
  }
}

export const storage = new DatabaseStorage();
