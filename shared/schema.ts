import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - supports both customers and restaurant owners
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("customer"), // "customer" | "restaurant_owner" | "employee"
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionPlan: varchar("subscription_plan").default("trial"), // "trial" | "basic" | "pro" | "enterprise"
  trialEndsAt: timestamp("trial_ends_at"),
  isTrialActive: boolean("is_trial_active").default(true),
  // Campos específicos para funcionários
  restaurantId: varchar("restaurant_id"), // Apenas para funcionários - reference will be added later
  permissions: text("permissions").array(), // Permissões do funcionário
  password: varchar("password"), // Senha local para funcionários
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Restaurants table
export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  logoUrl: varchar("logo_url"),
  bannerUrl: varchar("banner_url"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00"),
  minDeliveryTime: integer("min_delivery_time").default(20), // in minutes
  maxDeliveryTime: integer("max_delivery_time").default(40), // in minutes
  isActive: boolean("is_active").default(true),
  openingTime: varchar("opening_time").default("00:00"), // Horário de abertura
  closingTime: varchar("closing_time").default("22:22"), // Horário de fechamento
  deliveryTime: integer("delivery_time").default(30), // Tempo de entrega em minutos
  openingHours: jsonb("opening_hours"), // JSON with daily hours
  deliveryZipCodes: text("delivery_zip_codes").array(),
  whatsappNumber: varchar("whatsapp_number"),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  categoryId: varchar("category_id").references(() => categories.id),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  availabilityType: varchar("availability_type").notNull().default("local_and_delivery"), // "local_only" | "local_and_delivery"
  preparationTime: integer("preparation_time").default(15), // in minutes
  ingredients: text("ingredients").array(),
  allergens: text("allergens").array(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product variations (size, flavor, etc.)
export const productVariations = pgTable("product_variations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
});

// Additional items (extras)
export const additionals = pgTable("additionals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  name: varchar("name").notNull(),
  description: text("description"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  orderNumber: integer("order_number").notNull(),
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone"),
  customerAddress: text("customer_address"),
  status: varchar("status").notNull().default("pending"), // "pending" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled"
  orderType: varchar("order_type").notNull().default("delivery"), // "delivery" | "pickup"
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  variationId: varchar("variation_id").references(() => productVariations.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  additionalIds: text("additional_ids").array(), // References to additionals
  specialInstructions: text("special_instructions"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
  costPrice: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertAdditionalSchema = createInsertSchema(additionals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
  costPrice: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
});


// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Category = typeof categories.$inferSelect;
export type Additional = typeof additionals.$inferSelect;
export type ProductVariation = typeof productVariations.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertAdditional = z.infer<typeof insertAdditionalSchema>;

export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type OpeningHour = typeof openingHours.$inferSelect;
export type InsertOpeningHour = z.infer<typeof insertOpeningHoursSchema>;

// Relations
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
  orders: many(orders),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, { fields: [restaurants.ownerId], references: [users.id] }),
  categories: many(categories),
  products: many(products),
  orders: many(orders),
  additionals: many(additionals),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [categories.restaurantId], references: [restaurants.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [products.restaurantId], references: [restaurants.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variations: many(productVariations),
  orderItems: many(orderItems),
}));

export const productVariationsRelations = relations(productVariations, ({ one }) => ({
  product: one(products, { fields: [productVariations.productId], references: [products.id] }),
}));

export const additionalsRelations = relations(additionals, ({ one }) => ({
  restaurant: one(restaurants, { fields: [additionals.restaurantId], references: [restaurants.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, { fields: [orders.customerId], references: [users.id] }),
  restaurant: one(restaurants, { fields: [orders.restaurantId], references: [restaurants.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variation: one(productVariations, { fields: [orderItems.variationId], references: [productVariations.id] }),
}));

// Tables (mesas)
export const tables = pgTable("tables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  number: varchar("number").notNull(),
  name: varchar("name"),
  capacity: integer("capacity").default(4),
  isActive: boolean("is_active").default(true),
  qrCode: varchar("qr_code").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Opening hours (horários de funcionamento)
export const openingHours = pgTable("opening_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openTime: varchar("open_time"), // "09:00"
  closeTime: varchar("close_time"), // "22:00"
  isClosed: boolean("is_closed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for new tables
export const tablesRelations = relations(tables, ({ one }) => ({
  restaurant: one(restaurants, { fields: [tables.restaurantId], references: [restaurants.id] }),
}));

export const openingHoursRelations = relations(openingHours, ({ one }) => ({
  restaurant: one(restaurants, { fields: [openingHours.restaurantId], references: [restaurants.id] }),
}));

// Insert schemas for new tables
export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOpeningHoursSchema = createInsertSchema(openingHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Área de Atendimento por Bairros
export const serviceAreas = pgTable("service_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  neighborhood: varchar("neighborhood").notNull(), // Nome do bairro
  city: varchar("city").notNull(), // Cidade
  state: varchar("state").notNull(), // Estado (UF)
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations para service areas
export const serviceAreasRelations = relations(serviceAreas, ({ one }) => ({
  restaurant: one(restaurants, { fields: [serviceAreas.restaurantId], references: [restaurants.id] }),
}));

// Insert schema para service areas
export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos para service areas
export type ServiceArea = typeof serviceAreas.$inferSelect;
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
