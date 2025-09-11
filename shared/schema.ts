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
  phone: varchar("phone"),
  address: text("address"),
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
  notificationWhatsapp: varchar("notification_whatsapp"), // Número para envio de notificações
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

// PIX Payments table
export const pixPayments = pgTable("pix_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  asaasPaymentId: varchar("asaas_payment_id"),
  asaasCustomerId: varchar("asaas_customer_id"),
  qrCodePayload: text("qr_code_payload"),
  qrCodeImage: text("qr_code_image"),
  status: varchar("status").notNull().default("pending"), // "pending" | "paid" | "expired" | "cancelled"
  expirationDate: timestamp("expiration_date"),
  paidAt: timestamp("paid_at"),
  billingPeriodMonths: integer("billing_period_months").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment History table
export const paymentHistory = pgTable("payment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  pixPaymentId: varchar("pix_payment_id").references(() => pixPayments.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method").notNull().default("pix"), // "pix" | "credit_card" | "bank_slip"
  status: varchar("status").notNull(), // "paid" | "refunded" | "cancelled"
  paidAt: timestamp("paid_at").notNull(),
  refundedAt: timestamp("refunded_at"),
  planStartDate: timestamp("plan_start_date").notNull(),
  planEndDate: timestamp("plan_end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
  tableId: varchar("table_id").references(() => tables.id), // Para pedidos no local
  orderNumber: integer("order_number").notNull(),
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone"),
  customerAddress: text("customer_address"),
  status: varchar("status").notNull().default("pending"), // "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled"
  orderType: varchar("order_type").notNull().default("delivery"), // "delivery" | "pickup" | "table"
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
  orderNumber: true, // Auto-generated
}).extend({
  subtotal: z.union([z.string(), z.number()]).transform(val => String(val)),
  deliveryFee: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  total: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
}).extend({
  unitPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  totalPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
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
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

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
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  items: many(orderItems),
  messages: many(orderMessages),
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

// Tabela de Favoritos dos Usuários
export const userFavorites = pgTable("user_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations para favoritos
export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, { fields: [userFavorites.userId], references: [users.id] }),
  restaurant: one(restaurants, { fields: [userFavorites.restaurantId], references: [restaurants.id] }),
}));

// Insert schema para favoritos
export const insertUserFavoriteSchema = createInsertSchema(userFavorites).omit({
  id: true,
  createdAt: true,
});

// Tipos para favoritos
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;

// Tabela de Mensagens do Pedido
export const orderMessages = pgTable("order_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  senderType: varchar("sender_type").notNull(), // "customer" | "restaurant"
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations para mensagens
export const orderMessagesRelations = relations(orderMessages, ({ one }) => ({
  order: one(orders, { fields: [orderMessages.orderId], references: [orders.id] }),
  sender: one(users, { fields: [orderMessages.senderId], references: [users.id] }),
}));

// Insert schema para mensagens
export const insertOrderMessageSchema = createInsertSchema(orderMessages).omit({
  id: true,
  createdAt: true,
});

// Tipos para mensagens
export type OrderMessage = typeof orderMessages.$inferSelect;
export type InsertOrderMessage = z.infer<typeof insertOrderMessageSchema>;

// Tabela de Cupons
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  code: varchar("code", { length: 50 }).notNull(),
  description: varchar("description", { length: 255 }),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // "percentage" ou "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de Uso de Cupons
export const couponUsages = pgTable("coupon_usages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// Relations para cupons
export const couponsRelations = relations(coupons, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [coupons.restaurantId], references: [restaurants.id] }),
  usages: many(couponUsages),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, { fields: [couponUsages.couponId], references: [coupons.id] }),
  order: one(orders, { fields: [couponUsages.orderId], references: [orders.id] }),
}));

// Insert schemas para cupons
export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usedCount: true,
}).extend({
  discountValue: z.union([z.string(), z.number()]).transform(val => String(val)),
  minOrderValue: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  maxUses: z.union([z.string(), z.number()]).transform(val => val ? Number(val) : null).optional(),
  validFrom: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  validUntil: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertCouponUsageSchema = createInsertSchema(couponUsages).omit({
  id: true,
  usedAt: true,
}).extend({
  discountApplied: z.union([z.string(), z.number()]).transform(val => String(val)),
});

// Tipos para cupons
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type CouponUsage = typeof couponUsages.$inferSelect;
export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;

// Tabela de Planos de Assinatura
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Básico", "Pro", "Enterprise"
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingPeriod: varchar("billing_period").notNull().default("monthly"), // "monthly" | "yearly"
  maxRestaurants: integer("max_restaurants").default(1),
  maxProducts: integer("max_products").default(50),
  maxOrders: integer("max_orders").default(100), // Por mês
  trialDays: integer("trial_days").default(0), // Dias de teste gratuito
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de Funcionalidades do Sistema
export const systemFeatures = pgTable("system_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Relatórios de Lucro", "WhatsApp", "Sistema de Cupons"
  description: text("description"),
  featureKey: varchar("feature_key").unique().notNull(), // "profit_reports", "whatsapp_integration"
  category: varchar("category").notNull(), // "reporting", "communication", "marketing"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de Relação entre Planos e Funcionalidades
export const planFeatures = pgTable("plan_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  featureId: varchar("feature_id").notNull().references(() => systemFeatures.id),
  isIncluded: boolean("is_included").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de Usuários Administrativos
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(), // Hashed
  email: varchar("email").unique(),
  fullName: varchar("full_name"),
  role: varchar("role").notNull().default("admin"), // "admin", "superadmin"
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de Logs de Atividade Admin
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => adminUsers.id),
  action: varchar("action").notNull(), // "create_plan", "update_user", "view_reports"
  entityType: varchar("entity_type"), // "user", "restaurant", "plan"
  entityId: varchar("entity_id"),
  details: jsonb("details"), // JSON com detalhes da ação
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations para novas tabelas
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  planFeatures: many(planFeatures),
}));

export const systemFeaturesRelations = relations(systemFeatures, ({ many }) => ({
  planFeatures: many(planFeatures),
}));

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  plan: one(subscriptionPlans, { fields: [planFeatures.planId], references: [subscriptionPlans.id] }),
  feature: one(systemFeatures, { fields: [planFeatures.featureId], references: [systemFeatures.id] }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  logs: many(adminLogs),
}));

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(adminUsers, { fields: [adminLogs.adminId], references: [adminUsers.id] }),
}));

// Insert schemas para novas tabelas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertSystemFeatureSchema = createInsertSchema(systemFeatures).omit({
  id: true,
  createdAt: true,
});

export const insertPlanFeatureSchema = createInsertSchema(planFeatures).omit({
  id: true,
  createdAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

// PIX Payments schemas
export const insertPixPaymentSchema = createInsertSchema(pixPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
});

// PIX Payment relations
export const pixPaymentsRelations = relations(pixPayments, ({ one }) => ({
  restaurant: one(restaurants, { fields: [pixPayments.restaurantId], references: [restaurants.id] }),
  user: one(users, { fields: [pixPayments.userId], references: [users.id] }),
  plan: one(subscriptionPlans, { fields: [pixPayments.planId], references: [subscriptionPlans.id] }),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  restaurant: one(restaurants, { fields: [paymentHistory.restaurantId], references: [restaurants.id] }),
  user: one(users, { fields: [paymentHistory.userId], references: [users.id] }),
  plan: one(subscriptionPlans, { fields: [paymentHistory.planId], references: [subscriptionPlans.id] }),
  pixPayment: one(pixPayments, { fields: [paymentHistory.pixPaymentId], references: [pixPayments.id] }),
}));

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

// Tipos para novas tabelas
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type SystemFeature = typeof systemFeatures.$inferSelect;
export type InsertSystemFeature = z.infer<typeof insertSystemFeatureSchema>;

export type PlanFeature = typeof planFeatures.$inferSelect;
export type InsertPlanFeature = z.infer<typeof insertPlanFeatureSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
