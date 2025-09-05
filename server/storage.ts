import {
  users,
  restaurants,
  products,
  categories,
  orders,
  orderItems,
  additionals,
  productVariations,
  tables,
  openingHours,
  serviceAreas,
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
  type Table,
  type InsertTable,
  type OpeningHour,
  type InsertOpeningHour,
  type ServiceArea,
  type InsertServiceArea,
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
  
  // Table operations
  getTables(restaurantId: string): Promise<Table[]>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: string, updates: Partial<InsertTable>): Promise<Table>;
  deleteTable(id: string): Promise<void>;
  getTableByQrCode(qrCode: string): Promise<Table | undefined>;
  
  // Opening hours operations
  getOpeningHours(restaurantId: string): Promise<OpeningHour[]>;
  createOpeningHour(openingHour: InsertOpeningHour): Promise<OpeningHour>;
  updateOpeningHour(id: string, updates: Partial<InsertOpeningHour>): Promise<OpeningHour>;
  deleteOpeningHour(id: string): Promise<void>;
  upsertOpeningHours(restaurantId: string, hours: InsertOpeningHour[]): Promise<OpeningHour[]>;
  
  // Employee operations
  createEmployee(employee: UpsertUser): Promise<User>;
  getEmployees(restaurantId: string): Promise<User[]>;
  updateEmployee(id: string, updates: Partial<UpsertUser>): Promise<User>;
  deleteEmployee(id: string): Promise<void>;
  
  // Service area operations (substituindo delivery zones)
  getServiceAreas(restaurantId: string): Promise<ServiceArea[]>;
  createServiceArea(area: InsertServiceArea): Promise<ServiceArea>;
  updateServiceArea(id: string, updates: Partial<InsertServiceArea>): Promise<ServiceArea>;
  deleteServiceArea(id: string): Promise<void>;
  getCityNeighborhoods(city: string, state: string): Promise<string[]>;
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

  // Table operations
  async getTables(restaurantId: string): Promise<Table[]> {
    return await db
      .select()
      .from(tables)
      .where(eq(tables.restaurantId, restaurantId))
      .orderBy(tables.number);
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db
      .insert(tables)
      .values(table)
      .returning();
    return newTable;
  }

  async updateTable(id: string, updates: Partial<InsertTable>): Promise<Table> {
    const [table] = await db
      .update(tables)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tables.id, id))
      .returning();
    return table;
  }

  async deleteTable(id: string): Promise<void> {
    await db.delete(tables).where(eq(tables.id, id));
  }

  async getTableByQrCode(qrCode: string): Promise<Table | undefined> {
    const [table] = await db
      .select()
      .from(tables)
      .where(eq(tables.qrCode, qrCode));
    return table;
  }

  // Opening hours operations
  async getOpeningHours(restaurantId: string): Promise<OpeningHour[]> {
    return await db
      .select()
      .from(openingHours)
      .where(eq(openingHours.restaurantId, restaurantId))
      .orderBy(openingHours.dayOfWeek);
  }

  async createOpeningHour(openingHour: InsertOpeningHour): Promise<OpeningHour> {
    const [newOpeningHour] = await db
      .insert(openingHours)
      .values(openingHour)
      .returning();
    return newOpeningHour;
  }

  async updateOpeningHour(id: string, updates: Partial<InsertOpeningHour>): Promise<OpeningHour> {
    const [openingHour] = await db
      .update(openingHours)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(openingHours.id, id))
      .returning();
    return openingHour;
  }

  async deleteOpeningHour(id: string): Promise<void> {
    await db.delete(openingHours).where(eq(openingHours.id, id));
  }

  async upsertOpeningHours(restaurantId: string, hours: InsertOpeningHour[]): Promise<OpeningHour[]> {
    // Remove existing hours for this restaurant
    await db.delete(openingHours).where(eq(openingHours.restaurantId, restaurantId));
    
    // Insert new hours
    if (hours.length > 0) {
      return await db.insert(openingHours).values(hours).returning();
    }
    return [];
  }

  // Employee operations
  async createEmployee(employee: UpsertUser): Promise<User> {
    const [newEmployee] = await db
      .insert(users)
      .values({
        ...employee,
        role: "employee"
      })
      .returning();
    return newEmployee;
  }

  async getEmployees(restaurantId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, "employee"), eq(users.restaurantId, restaurantId)));
  }

  async updateEmployee(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [employee] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Service area operations (substituindo delivery zones)
  async getServiceAreas(restaurantId: string): Promise<ServiceArea[]> {
    return await db
      .select()
      .from(serviceAreas)
      .where(eq(serviceAreas.restaurantId, restaurantId))
      .orderBy(serviceAreas.neighborhood);
  }

  async createServiceArea(area: InsertServiceArea): Promise<ServiceArea> {
    const [newArea] = await db
      .insert(serviceAreas)
      .values(area)
      .returning();
    return newArea;
  }

  async updateServiceArea(id: string, updates: Partial<InsertServiceArea>): Promise<ServiceArea> {
    const [area] = await db
      .update(serviceAreas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceAreas.id, id))
      .returning();
    return area;
  }

  async deleteServiceArea(id: string): Promise<void> {
    await db.delete(serviceAreas).where(eq(serviceAreas.id, id));
  }

  // Funções para integração com API do IBGE
  async getStates(): Promise<Array<{id: number, sigla: string, nome: string}>> {
    try {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const states = await response.json();
      return states.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
    } catch (error) {
      console.error('Erro ao buscar estados:', error);
      return [];
    }
  }

  async getMunicipalities(stateId: number): Promise<Array<{id: number, nome: string}>> {
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const municipalities = await response.json();
      return municipalities.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      return [];
    }
  }

  async getDistricts(municipalityId: number): Promise<Array<{id: number, nome: string}>> {
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${municipalityId}/distritos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const districts = await response.json();
      return districts.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
    } catch (error) {
      console.error('Erro ao buscar distritos:', error);
      return [];
    }
  }

  async findMunicipalityByName(cityName: string, stateCode: string): Promise<number | null> {
    try {
      const states = await this.getStates();
      const state = states.find(s => s.sigla.toUpperCase() === stateCode.toUpperCase());
      
      if (!state) {
        console.log(`Estado não encontrado: ${stateCode}`);
        return null;
      }

      const municipalities = await this.getMunicipalities(state.id);
      const municipality = municipalities.find(m => 
        m.nome.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(m.nome.toLowerCase())
      );

      return municipality ? municipality.id : null;
    } catch (error) {
      console.error('Erro ao buscar município por nome:', error);
      return null;
    }
  }

  // Função para buscar bairros de uma cidade usando API do ViaCEP
  async getCityNeighborhoods(city: string, state: string): Promise<string[]> {
    try {
      console.log(`Buscando bairros para ${city}-${state} via ViaCEP...`);
      
      // Primeira tentativa: usar ViaCEP para buscar bairros reais
      const neighborhoodsFromViaCep = await this.getNeighborhoodsFromViaCep(city, state);
      
      if (neighborhoodsFromViaCep.length > 0) {
        console.log(`Encontrados ${neighborhoodsFromViaCep.length} bairros via ViaCEP`);
        return neighborhoodsFromViaCep;
      }

      // Fallback: usar dados locais mais detalhados
      console.log(`ViaCEP não retornou bairros. Usando dados locais detalhados.`);
      return this.getDetailedLocalNeighborhoods(city, state);
      
    } catch (error) {
      console.error('Erro ao buscar bairros:', error);
      return this.getDetailedLocalNeighborhoods(city, state);
    }
  }

  // Nova função para buscar bairros via ViaCEP
  async getNeighborhoodsFromViaCep(city: string, state: string): Promise<string[]> {
    try {
      // ViaCEP permite busca por cidade/estado: viacep.com.br/ws/{UF}/{cidade}/{logradouro}/json/
      const response = await fetch(`https://viacep.com.br/ws/${state}/${encodeURIComponent(city)}/centro/json/`);
      
      if (!response.ok) {
        console.log(`ViaCEP não encontrou dados para ${city}/${state}`);
        return [];
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Extrair bairros únicos dos resultados
        const neighborhoods = [...new Set(data
          .map((item: any) => item.bairro)
          .filter((bairro: string) => bairro && bairro.trim() !== '')
        )];
        return neighborhoods.sort();
      }

      return [];
    } catch (error) {
      console.error('Erro ao consultar ViaCEP:', error);
      return [];
    }
  }

  // Função com dados locais mais detalhados por cidade
  private getDetailedLocalNeighborhoods(city: string, state: string): string[] {
    const cityKey = `${city.toLowerCase()}-${state.toLowerCase()}`;
    
    const detailedNeighborhoods: Record<string, string[]> = {
      "petrópolis-rj": [
        "Centro", "Bingen", "Retiro", "Valparaíso", "Quitandinha", "Coronel Veiga",
        "Castelânea", "São Sebastião", "Cremerie", "Mosela", "Nogueira", "Duchas",
        "Alto da Serra", "Carangola", "Cascatinha", "Itaipava", "Pedro do Rio",
        "Posse", "Correas", "Araras", "Taquara", "Vila Felipe", "Quarteirão Brasileiro",
        "Chácara Flora", "Fazenda Inglesa", "Samambaia", "Independência"
      ],
      "são paulo-sp": [
        "Aclimação", "Água Branca", "Alto de Pinheiros", "Anhangabaú", "Bela Vista",
        "Brooklin", "Campo Belo", "Centro", "Consolação", "Ipiranga", "Itaim Bibi",
        "Jardins", "Liberdade", "Moema", "Morumbi", "Pinheiros", "Santa Cecília",
        "Santana", "Tatuapé", "Vila Madalena", "Vila Mariana", "Vila Olímpia"
      ],
      "rio de janeiro-rj": [
        "Copacabana", "Ipanema", "Leblon", "Barra da Tijuca", "Botafogo", "Flamengo",
        "Tijuca", "Centro", "Lapa", "Santa Teresa", "Catete", "Urca", "Lagoa",
        "Gávea", "São Conrado", "Recreio", "Jacarepaguá", "Vila Isabel", "Grajaú"
      ],
      "belo horizonte-mg": [
        "Centro", "Savassi", "Funcionários", "Lourdes", "Cruzeiro", "Serra",
        "Floresta", "Lagoinha", "Carlos Prates", "Cidade Nova", "Coração Eucarístico",
        "Prado", "Santa Efigênia", "São Pedro", "Santo Antônio", "Boa Viagem"
      ]
    };

    const neighborhoods = detailedNeighborhoods[cityKey] || this.getDefaultNeighborhoods(city);
    console.log(`Retornando ${neighborhoods.length} bairros para ${city}-${state}`);
    return neighborhoods;
  }

  // Função auxiliar para bairros padrão (fallback)
  private getDefaultNeighborhoods(city: string): string[] {
    const neighborhoods: Record<string, string[]> = {
      "São Paulo": [
        "Centro", "Vila Olímpia", "Jardins", "Moema", "Itaim Bibi", "Pinheiros", 
        "Vila Madalena", "Bela Vista", "Liberdade", "Brooklin", "Morumbi", 
        "Santana", "Tatuapé", "Anália Franco", "Vila Mariana", "Ipiranga"
      ],
      "Rio de Janeiro": [
        "Copacabana", "Ipanema", "Leblon", "Barra da Tijuca", "Botafogo", 
        "Flamengo", "Tijuca", "Centro", "Lapa", "Santa Teresa"
      ],
      "Petrópolis": [
        "Centro", "Pedro do Rio", "Quitandinha", "Retiro", "Valparaíso", 
        "Corrêas", "Nogueira", "Itaipava", "Quarteirão Brasileiro", "Cascatinha",
        "Alto da Serra", "Saldanha Marinho", "Chácara Flora", "Mosela", "Bingen"
      ],
    };
    
    return neighborhoods[city] || ["Centro"];
  }
}

export const storage = new DatabaseStorage();
