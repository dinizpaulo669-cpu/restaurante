# 🚀 Manual Completo do Desenvolvedor - GoFood Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)
![PWA](https://img.shields.io/badge/PWA-Ready-purple?style=for-the-badge)
![WebSocket](https://img.shields.io/badge/WebSocket-RealTime-orange?style=for-the-badge)

**🎯 Sistema Completo de Delivery/Restaurante com PWA e Real-time**

*Mapeamento Linha por Linha - Última atualização: 2025*

</div>

---

## 📂 ÍNDICE DE ARQUIVOS PRINCIPAIS

### 🎯 **NAVEGAÇÃO RÁPIDA POR ARQUIVO**

| 📁 **Arquivo** | 🎯 **Função Principal** | 📏 **Linhas** | 🔗 **Link Rápido** |
|----------------|------------------------|---------------|-------------------|
| 🗄️ [`shared/schema.ts`](#-sharedschema-modelos-de-dados) | Modelos de dados e tipos | 728 | [Ver Schema →](#tabela-users) |
| ⚙️ [`server/routes.ts`](#-serverroutes-apis-e-endpoints) | APIs e endpoints | 4469 | [Ver APIs →](#-rotas-de-autenticação) |
| 📱 [`server/index.ts`](#-serverindex-servidor-principal) | Configuração servidor | 83 | [Ver Servidor →](#configuração-do-servidor) |
| 🔐 [`server/replitAuth.ts`](#-serverreplitauth-autenticação) | Sistema de auth | - | [Ver Auth →](#sistema-de-autenticação) |
| 📞 [`server/whatsappService.ts`](#-serverwhatsappservice-integração-whatsapp) | WhatsApp integration | - | [Ver WhatsApp →](#integração-whatsapp) |
| 🏠 [`client/src/App.tsx`](#-clientsrcapp-roteamento-principal) | Roteamento React | 59 | [Ver Rotas →](#roteamento-principal) |
| 🎣 [`client/src/hooks/`](#-clientsrchooks-hooks-customizados) | Hooks customizados | - | [Ver Hooks →](#hooks-personalizados) |
| 📄 [`client/src/pages/`](#-clientsrcpages-páginas-da-aplicação) | Páginas da aplicação | - | [Ver Páginas →](#catálogo-de-páginas) |

---

## 📋 ÍNDICE DETALHADO

<details>
<summary><strong>🧭 NAVEGAÇÃO POR SEÇÃO</strong></summary>

1. [📂 **Arquivos Core**](#-arquivos-core)
2. [🗄️ **Modelos de Dados**](#-modelos-de-dados-sharedschema)  
3. [🔗 **APIs Backend**](#-apis-backend-serverroutes)
4. [📱 **Frontend Pages**](#-frontend-pages-clientsrcpages)
5. [🎣 **Hooks & Utils**](#-hooks--utils)
6. [🔄 **Fluxos Principais**](#-fluxos-principais)
7. [🎨 **Componentes UI**](#-componentes-ui)
8. [⚙️ **Configurações**](#-configurações)
9. [🧪 **Testing & Debug**](#-testing--debug)

</details>

---

## 📂 Arquivos Core

### 🗄️ `shared/schema.ts` - Modelos de Dados

**📍 Localização**: `shared/schema.ts` (728 linhas)

<details>
<summary><strong>📋 Mapeamento Linha por Linha</strong></summary>

| 📏 **Linhas** | 🏷️ **Tabela/Schema** | 🎯 **Descrição** |
|--------------|---------------------|------------------|
| **17-25** | `sessions` | Sessões de autenticação Replit |
| **28-48** | `users` | Usuários (clientes, donos, funcionários) |
| **51-79** | `restaurants` | Dados dos restaurantes |
| **82-90** | `categories` | Categorias de produtos |
| **93-112** | `products` | Produtos do cardápio |
| **115-121** | `productVariations` | Variações de produtos (tamanho, sabor) |
| **124-141** | `pixPayments` | Pagamentos PIX (Asaas) |
| **144-158** | `paymentHistory` | Histórico de pagamentos |
| **161-172** | `additionals` | Itens adicionais (extras) |
| **175-195** | `orders` | Pedidos dos clientes |
| **198-208** | `orderItems` | Itens de cada pedido |
| **348-358** | `tables` | Mesas do restaurante |
| **361-370** | `openingHours` | Horários de funcionamento |
| **395-405** | `serviceAreas` | Áreas de atendimento por bairro |
| **424-429** | `userFavorites` | Restaurantes favoritos |
| **448-456** | `restaurantReviews` | Avaliações de restaurantes |
| **479-487** | `orderMessages` | Chat de pedidos |
| **506-521** | `coupons` | Sistema de cupons |
| **524-530** | `couponUsages` | Uso de cupons |

</details>

#### 📋 **Tabela `users`** 
```typescript
// Localização: shared/schema.ts:28-48
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),        // L29
  email: varchar("email").unique(),                                      // L30  
  firstName: varchar("first_name"),                                      // L31
  lastName: varchar("last_name"),                                        // L32
  phone: varchar("phone"),                                               // L33
  address: text("address"),                                              // L34
  profileImageUrl: varchar("profile_image_url"),                        // L35
  role: varchar("role").notNull().default("customer"),                  // L36: "customer"|"restaurant_owner"|"employee"
  stripeCustomerId: varchar("stripe_customer_id"),                      // L37
  stripeSubscriptionId: varchar("stripe_subscription_id"),              // L38
  subscriptionPlan: varchar("subscription_plan").default("trial"),      // L39: "trial"|"basic"|"pro"|"enterprise"
  trialEndsAt: timestamp("trial_ends_at"),                              // L40
  isTrialActive: boolean("is_trial_active").default(true),              // L41
  restaurantId: varchar("restaurant_id"),                               // L43: Para funcionários
  permissions: text("permissions").array(),                             // L44
  password: varchar("password"),                                        // L45: Senha local funcionários
  createdAt: timestamp("created_at").defaultNow(),                      // L46
  updatedAt: timestamp("updated_at").defaultNow(),                      // L47
});
```

#### 🏪 **Tabela `restaurants`**
```typescript
// Localização: shared/schema.ts:51-79
export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),       // L52
  ownerId: varchar("owner_id").notNull().references(() => users.id),    // L53
  name: varchar("name").notNull(),                                       // L54
  description: text("description"),                                      // L55
  category: varchar("category").notNull(),                              // L56
  address: text("address").notNull(),                                    // L57
  phone: varchar("phone"),                                               // L58
  email: varchar("email"),                                               // L59
  logoUrl: varchar("logo_url"),                                          // L60
  bannerUrl: varchar("banner_url"),                                      // L61
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"), // L62
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00"), // L63
  minDeliveryTime: integer("min_delivery_time").default(20),            // L64
  maxDeliveryTime: integer("max_delivery_time").default(40),            // L65
  isActive: boolean("is_active").default(true),                         // L66
  openingTime: varchar("opening_time").default("00:00"),                // L67
  closingTime: varchar("closing_time").default("22:22"),                // L68
  deliveryTime: integer("delivery_time").default(30),                   // L69
  openingHours: jsonb("opening_hours"),                                  // L70
  deliveryZipCodes: text("delivery_zip_codes").array(),                 // L71
  whatsappNumber: varchar("whatsapp_number"),                           // L72
  notificationWhatsapp: varchar("notification_whatsapp"),               // L73
  seoTitle: varchar("seo_title"),                                        // L74
  seoDescription: text("seo_description"),                               // L75
  seoCategories: text("seo_categories").array(),                        // L76
  createdAt: timestamp("created_at").defaultNow(),                      // L77
  updatedAt: timestamp("updated_at").defaultNow(),                      // L78
});
```

### ⚙️ `server/routes.ts` - APIs e Endpoints

**📍 Localização**: `server/routes.ts` (4469 linhas)

<details>
<summary><strong>🔗 Mapeamento de Rotas por Linha</strong></summary>

#### 🔐 **Rotas de Autenticação**
| 📏 **Linha** | 🌐 **Endpoint** | 🎯 **Função** |
|-------------|----------------|---------------|
| **121** | `GET /api/auth/user` | Usuário autenticado (Replit Auth) |
| **133** | `GET /api/dev/auth/user` | Dev user (desenvolvimento) |
| **1347** | `POST /api/internal-login` | Login local para funcionários |

#### 🏪 **Rotas de Restaurantes**  
| 📏 **Linha** | 🌐 **Endpoint** | 🎯 **Função** |
|-------------|----------------|---------------|
| **154** | `GET /api/restaurants` | 🔍 Busca pública (CEP, nome, categoria) |
| **252** | `GET /api/restaurants/:id` | Detalhes do restaurante |
| **287** | `POST /api/restaurants` | Criar restaurante |
| **338** | `GET /api/my-restaurant` | Restaurante do usuário |
| **364** | `GET /api/dev/my-restaurant` | Dev version |

#### 🍽️ **Rotas de Produtos**
| 📏 **Linha** | 🌐 **Endpoint** | 🎯 **Função** |
|-------------|----------------|---------------|
| **387** | `GET /api/restaurants/:id/products` | Produtos do restaurante |
| **420** | `GET /api/restaurants/:id/categories` | Categorias do restaurante |
| **1920** | `POST /api/dev/products` | Criar produto (com upload) |
| **1969** | `POST /api/dev/products/:id/stock` | Atualizar estoque |

#### 🛒 **Rotas de Pedidos**
| 📏 **Linha** | 🌐 **Endpoint** | 🎯 **Função** |
|-------------|----------------|---------------|
| **436** | `POST /api/orders` | Criar pedido |
| **541** | `GET /api/customer/orders` | Pedidos do cliente |
| **836** | `GET /api/my-orders` | Pedidos do restaurante |
| **784** | `PUT /api/orders/:id/status` | Atualizar status |

#### 💬 **Rotas de Chat**
| 📏 **Linha** | 🌐 **Endpoint** | 🎯 **Função** |
|-------------|----------------|---------------|
| **621** | `GET /api/orders/:orderId/messages` | Mensagens do pedido |
| **654** | `POST /api/orders/:orderId/messages` | Enviar mensagem |
| **736** | `PUT /api/orders/:orderId/messages/mark-read` | Marcar como lida |

#### 🍕 **Rotas de Mesas**
| 📏 **Linha** | 🌐 **Endpoint** | 🎯 **Função** |
|-------------|----------------|---------------|
| **1438** | `GET /api/restaurants/:id/tables` | Mesas do restaurante |
| **1454** | `POST /api/tables` | Criar mesa |
| **1525** | `GET /api/tables/qr/:qrCode` | Mesa por QR Code |
| **1545** | `GET /api/tables/:tableId/orders` | Pedidos da mesa |

</details>

#### 🛡️ **Middleware de Segurança**
```typescript
// Localização: server/routes.ts:60-118
const requireRestaurantOwner = async (req: any, res: any, next: any) => {
  // L62: Resolve user ID (dev vs production)
  let userId = null;
  
  // L65-67: Dev environment fallback  
  if (process.env.NODE_ENV === "development") {
    userId = req.user?.claims?.sub || "dev-user-internal";
  } else {
    // L69-73: Production auth check
    if (!(req.session as any)?.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    userId = (req.session as any).user.id;
  }

  // L76-80: Verify user exists and has restaurant_owner role
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  // L87-89: Role verification
  if (user.role !== "restaurant_owner") {
    return res.status(403).json({ message: "Access denied. Restaurant owner role required." });
  }

  // L92-94: Dev user mapping
  const actualOwnerId = (userId === "dev-user-internal" && process.env.NODE_ENV === "development") 
    ? "dev-user-123" 
    : userId;

  // L97-102: Find restaurant for owner
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, actualOwnerId))
    .orderBy(desc(restaurants.createdAt))
    .limit(1);

  // L109-111: Add to request object
  req.restaurant = restaurant;
  req.userId = userId;
  req.actualOwnerId = actualOwnerId;
  
  next();
};
```

#### 🔍 **Busca por CEP**
```typescript
// Localização: server/routes.ts:154-250
app.get("/api/restaurants", async (req, res) => {
  // L161: Detect if search is a ZIP code (8 digits)
  const isZipCode = search && typeof search === 'string' && /^\d{8}$/.test(search.replace(/\D/g, ''));
  
  if (isZipCode && typeof search === 'string') {
    // L166-167: Clean CEP and call ViaCEP API
    const cleanCep = search.replace(/\D/g, '');
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const viaCepData = await viaCepResponse.json();
    
    if (!viaCepData.erro) {
      // L172-194: Search restaurants that serve this area
      const serviceAreasResult = await db
        .select({ restaurantId: serviceAreas.restaurantId })
        .from(serviceAreas)
        .where(
          and(
            eq(serviceAreas.isActive, true),
            or(
              and(
                ilike(serviceAreas.city, `%${viaCepData.localidade}%`),
                ilike(serviceAreas.state, `%${viaCepData.uf}%`)
              ),
              ilike(serviceAreas.neighborhood, `%${viaCepData.bairro}%`)
            )
          )
        );
      
      restaurantIds = serviceAreasResult.map(area => area.restaurantId);
    }
  }
});
```

### 📱 `server/index.ts` - Servidor Principal

**📍 Localização**: `server/index.ts` (83 linhas)

#### 🗂️ **Configuração do Servidor**
```typescript
// Localização: server/index.ts:5-37
const app = express();
app.use(express.json());                     // L6
app.use(express.urlencoded({ extended: false })); // L7

// L9-37: Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();                  // L10
  const path = req.path;                     // L11
  let capturedJsonResponse: Record<string, any> | undefined = undefined; // L12

  // L14-18: Capture JSON responses
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // L20-36: Log on response finish
  res.on("finish", () => {
    const duration = Date.now() - start;     // L21
    if (path.startsWith("/api")) {           // L22
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`; // L23
      if (capturedJsonResponse) {            // L24
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`; // L25
      }

      if (logLine.length > 80) {             // L28
        logLine = logLine.slice(0, 79) + "…"; // L29
      }

      log(logLine);                          // L32
    }
  });

  next();                                    // L36
});
```

#### 🚀 **Inicialização do Servidor**
```typescript
// Localização: server/index.ts:39-82
(async () => {
  try {
    const server = await registerRoutes(app);          // L41

    // L43-49: Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error('Server error:', err);
    });

    // L52-54: Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // L59-65: Vite setup (development only)
    if (app.get("env") === "development") {
      console.log('Setting up Vite...');
      await setupVite(app, server);
      console.log('Vite setup complete');
    } else {
      serveStatic(app);                                 // L64
    }

    // L71-77: Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    console.log(`Starting server on port ${port}...`);
    
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port}`);
      console.log(`Server is ready and listening on 0.0.0.0:${port}`);
    });
  } catch (error) {
    // L78-81: Error handling
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
```

---

## 📱 Frontend Pages - `client/src/pages/`

### 🎯 **Catálogo de Páginas**

<details>
<summary><strong>📄 Mapeamento Linha por Linha de Todas as Páginas</strong></summary>

#### 🔐 **Página `/desenvolvedor`** - Login Administrativo
**📍 Arquivo**: `client/src/pages/desenvolvedor.tsx` (125 linhas)

| 📏 **Linhas** | 🎯 **Função** | 📝 **Descrição** |
|--------------|---------------|------------------|
| **1-11** | Imports | React hooks, routing, API client, UI components |
| **12-51** | `DevLogin()` | Componente principal da página |
| **14-16** | State management | `username`, `password`, location hook |
| **18-36** | Login mutation | Mutação TanStack Query para `/api/admin/login` |
| **38-51** | Form handler | Validação e submissão do formulário |
| **53-125** | JSX Template | Interface com tema dark premium |

**🔑 Test IDs Importantes**:
```typescript
// L62: Título da página
data-testid="admin-login-title"

// L85: Campo de usuário  
data-testid="input-username"

// L101: Campo de senha
data-testid="input-password"

// L110: Botão de login
data-testid="button-admin-login"
```

**🎨 Design Highlights**:
```typescript
// L54: Background com gradiente dark
className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"

// L58-60: Ícone com gradiente  
className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full"

// L108-109: Botão com gradiente
className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
```

#### 🏠 **Página Landing** - `/`
**📍 Arquivo**: `client/src/pages/landing.tsx` (445 linhas)

| 📏 **Linhas** | 🎯 **Seção** | 📝 **Descrição** |
|--------------|-------------|------------------|
| **1-18** | Setup | Imports e constantes de categorias |
| **20-33** | Hook principal | State e query para restaurantes |
| **36-70** | Header | Navegação e logo |
| **72-171** | Hero Section | Busca por CEP e call-to-action |
| **173-232** | Categories | Grid de categorias de restaurantes |
| **234-278** | Restaurants | Lista de restaurantes com loading |
| **280-326** | Features | Seção "Por que escolher o GoFood?" |
| **328-442** | CTA Business | Seção para restaurantes se cadastrarem |

**🔍 Busca por CEP**:
```typescript
// L103-107: Input de busca integrado
<Input
  type="text"
  placeholder="Digite seu endereço ou CEP"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  data-testid="input-address-search"
/>
```

**🎨 Categorias Dinâmicas**:
```typescript
// L185-229: Grid de categorias com cores dinâmicas
{categories.map(({ icon: Icon, name, value }, index) => {
  const colors = [
    "from-red-400 to-pink-500",      // Pizza
    "from-blue-400 to-indigo-500",   // Hambúrguer  
    "from-green-400 to-emerald-500", // Japonesa
    "from-purple-400 to-violet-500", // Sobremesa
    "from-yellow-400 to-orange-500", // Bebidas
    "from-teal-400 to-cyan-500"      // Saudável
  ];
})}
```

#### 👨‍💼 **Página Admin Dashboard** - `/admin-dashboard`
**📍 Arquivo**: `client/src/pages/admin-dashboard.tsx` (951 linhas)

| 📏 **Linhas** | 🎯 **Seção** | 📝 **Descrição** |
|--------------|-------------|------------------|
| **1-37** | Imports | Hooks, componentes UI, ícones |
| **39-103** | Interfaces | Types para AdminUser, DashboardStats, etc. |
| **105-231** | Hooks Setup | Queries, mutations, modal states |
| **233-283** | Helper Functions | Delete, format, status calculations |
| **298-334** | Header | Navigation e logout button |
| **337-364** | Tabs Navigation | 6 tabs: Dashboard, Restaurantes, Usuários, etc. |
| **367-413** | Dashboard Tab | Métricas principais (total restaurantes, usuários, receita) |
| **416-533** | Restaurantes Tab | Lista com busca, status trial, pagamentos |
| **536-650** | Usuários Tab | Administração de usuários |
| **652-760** | Planos Tab | Gestão de planos de assinatura |
| **762-830** | Features Tab | Controle de funcionalidades do sistema |
| **832-951** | Pagamentos Tab | Gestão de pagamentos PIX com confirmação manual |

**📊 Métricas Dashboard**:
```typescript
// L375-377: Total de restaurantes
<div className="text-2xl font-bold" data-testid="stat-total-restaurants">
  {dashboardStats?.totalRestaurants || 0}
</div>

// L390-392: Total de usuários
<div className="text-2xl font-bold" data-testid="stat-total-users">
  {dashboardStats?.totalUsers || 0}
</div>

// L405-407: Receita total
<div className="text-2xl font-bold" data-testid="stat-total-revenue">
  {formatCurrency(dashboardStats?.totalRevenue || 0)}
</div>
```

**💳 Confirmação de Pagamentos PIX**:
```typescript
// L209-231: Mutação para confirmar pagamento
const confirmPaymentMutation = useMutation({
  mutationFn: (paymentId: string) => 
    apiRequest("POST", `/api/admin/payments/${paymentId}/confirm`, {}),
  onSuccess: () => {
    // Invalida múltiplos caches
    queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    
    toast({
      title: "Pagamento confirmado",
      description: "O pagamento foi confirmado e o plano foi ativado",
    });
  }
});
```

#### 📊 **Página Controle** - `/controle`
**📍 Arquivo**: `client/src/pages/controle.tsx` (586 linhas)

| 📏 **Linhas** | 🎯 **Seção** | 📝 **Descrição** |
|--------------|-------------|------------------|
| **1-25** | Imports | React, query, auth, UI components, charts |
| **27-102** | Setup & Queries | Auth check, queries para stats e profit |
| **103-127** | Loading States | Loading e redirect guards |
| **129-171** | Header | Título, navegação, seletor de período |
| **173-175** | PWA Install | Componente de instalação PWA |
| **177-258** | Métricas Cards | 4 cards: Receita, Pedidos, Ticket Médio, Produtos |
| **260-456** | Relatório Lucro | Seção completa de análise de lucro |
| **458-542** | Gráficos | Charts de vendas e categorias |
| **544-586** | Top Produtos | Ranking de produtos mais vendidos |

**📈 Relatórios de Lucro**:
```typescript
// L71-80: Query para relatório de lucro
const { data: profitReport } = useQuery<any>({
  queryKey: ["/api/restaurant/profit-report"],
  enabled: isAuthenticated
});

// L272-275: Exibição do lucro total
<p className="text-2xl sm:text-3xl font-bold text-green-600">
  R$ {(profitReport?.totalProfit?.totalProfit || 0).toFixed(2)}
</p>

// L295-296: Margem de lucro
<p className="text-2xl sm:text-3xl font-bold text-blue-600">
  {(profitReport?.totalProfit?.profitMargin || 0).toFixed(1)}%
</p>
```

**📊 Gráficos Interativos**:
```typescript
// L367-401: Gráfico de lucro por período (Recharts)
{(profitReport?.profitByDay && profitReport.profitByDay.length > 0) ? (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={profitReport.profitByDay}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip formatter={(value: any, name: string) => [
        `R$ ${Number(value).toFixed(2)}`, 
        name === 'totalProfit' ? 'Lucro' : 
        name === 'totalRevenue' ? 'Receita' : 'Custo'
      ]}/>
      <Line type="monotone" dataKey="totalProfit" stroke="#22c55e" strokeWidth={2} name="Lucro"/>
      <Line type="monotone" dataKey="totalRevenue" stroke="#3b82f6" strokeWidth={1} name="Receita"/>
      <Line type="monotone" dataKey="totalCost" stroke="#ef4444" strokeWidth={1} name="Custo"/>
    </LineChart>
  </ResponsiveContainer>
) : (
  // L402-410: Estado vazio
  <div className="h-64 flex items-center justify-center text-gray-500">
    <div className="text-center">
      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p className="text-lg font-medium">Nenhum dado de lucro ainda</p>
      <p className="text-sm">Dados aparecerão conforme você realizar vendas</p>
    </div>
  </div>
)}
```

</details>

---

## 🎣 Hooks & Utils

### 🌐 **WebSocket Hook** - `use-websocket.ts`

**📍 Arquivo**: `client/src/hooks/use-websocket.ts` (204 linhas)

<details>
<summary><strong>🔧 Estrutura do Hook WebSocket</strong></summary>

| 📏 **Linhas** | 🎯 **Função** | 📝 **Descrição** |
|--------------|---------------|------------------|
| **1-17** | Imports & Types | Definições de tipos para mensagens |
| **19-25** | Hook Setup | Estado de conexão e refs |
| **26-153** | `connect()` | Função principal de conexão |
| **39-60** | onOpen Handler | Autenticação e join em canais |
| **62-133** | onMessage Handler | Processamento de mensagens por tipo |
| **135-147** | onClose Handler | Reconexão automática |
| **155-162** | `disconnect()` | Limpeza da conexão |
| **164-171** | `sendMessage()` | Envio de mensagens |
| **174-181** | useEffect | Auto-connect no mount |
| **184-195** | `getStatusLabel()` | Helper para labels de status |

</details>

#### 🔌 **Conexão WebSocket**
```typescript
// Localização: client/src/hooks/use-websocket.ts:26-60
const connect = () => {
  // L33-34: Determina protocolo (ws/wss)
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const ws = new WebSocket(wsUrl);                    // L36
  wsRef.current = ws;                                 // L37
  
  ws.onopen = () => {
    console.log('WebSocket conectado');               // L40
    setIsConnected(true);                             // L41
    setConnectionStatus('connected');                 // L42
    
    // L45-51: Autenticação automática
    if (options.userId && options.userType) {
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: options.userId,
        userType: options.userType
      }));
    }
    
    // L54-59: Join em canal de pedido específico
    if (options.orderId) {
      ws.send(JSON.stringify({
        type: 'join_order',
        orderId: options.orderId
      }));
    }
  };
};
```

#### 📨 **Processamento de Mensagens**
```typescript
// Localização: client/src/hooks/use-websocket.ts:62-133
ws.onmessage = (event) => {
  try {
    const message: WebSocketMessage = JSON.parse(event.data);  // L64
    
    // L70-82: Diferentes tipos de mensagem
    switch (message.type) {
      case 'connection':
        console.log('Conexão confirmada:', message.connectionId); // L72
        break;
        
      case 'authenticated':
        console.log('Autenticado como:', message.userType, message.userId); // L76
        break;
        
      case 'joined_order':
        console.log('Conectado ao pedido:', message.orderId);    // L80
        break;
        
      case 'new_message':
        // L84-87: Invalidar cache de mensagens
        queryClient.invalidateQueries({ 
          queryKey: [`/api/orders/${message.message.orderId}/messages`] 
        });
        
        // L90-92: Callback customizado
        if (options.onNewMessage) {
          options.onNewMessage(message.message);
        }
        
        // L95-101: Toast para mensagens de outros usuários
        if (message.message.senderType !== options.userType) {
          toast({
            title: "Nova mensagem",
            description: `${message.message.senderType === 'restaurant' ? 'Restaurante' : 'Cliente'}: ${message.message.message}`,
            duration: 5000,
          });
        }
        break;
        
      case 'status_updated':
      case 'order_status_updated':
        // L107-108: Invalidar cache de pedidos
        queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
        
        // L111-113: Callback de status
        if (options.onStatusUpdate) {
          options.onStatusUpdate(message.status, message.order);
        }
        
        // L116-120: Toast de atualização
        toast({
          title: "Status do pedido atualizado",
          description: `Pedido #${message.order?.orderNumber || message.orderId.slice(-6)}: ${getStatusLabel(message.status)}`,
          duration: 5000,
        });
        break;
    }
  } catch (error) {
    console.error('Erro ao processar mensagem WebSocket:', error); // L131
  }
};
```

#### 🔄 **Reconexão Automática**
```typescript
// Localização: client/src/hooks/use-websocket.ts:135-147
ws.onclose = (event) => {
  console.log('WebSocket desconectado:', event.code, event.reason); // L136
  setIsConnected(false);                                           // L137
  setConnectionStatus('disconnected');                             // L138
  wsRef.current = null;                                           // L139
  
  // L142-146: Reconexão automática (exceto fechamento intencional)
  if (event.code !== 1000) {
    setTimeout(() => {
      connect();
    }, 3000);
  }
};
```

### 📱 **PWA Hook** - `use-pwa.ts`

**📍 Arquivo**: `client/src/hooks/use-pwa.ts` (209 linhas)

<details>
<summary><strong>🔧 Funcionalidades PWA</strong></summary>

| 📏 **Linhas** | 🎯 **Função** | 📝 **Descrição** |
|--------------|---------------|------------------|
| **1-12** | Setup | Imports e interfaces |
| **8-64** | Hook Principal | Estado e event listeners |
| **14-28** | Detecção Suporte | Verificação de compatibilidade |
| **30-52** | Event Listeners | beforeinstallprompt, appinstalled |
| **66-95** | Service Worker | Registro e update handling |
| **97-123** | `installPWA()` | Trigger de instalação |
| **125-150** | `updateServiceWorker()` | Forçar atualização |
| **152-172** | `getCacheInfo()` | Info do cache |
| **174-197** | `clearCache()` | Limpeza completa |

</details>

#### 📱 **Detecção de Instalação**
```typescript
// Localização: client/src/hooks/use-pwa.ts:19-28
const checkIfInstalled = () => {
  // L21: Standalone mode (Android/desktop)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // L22: iOS Safari PWA mode
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  
  // L23: Chrome PWA mode  
  const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
  
  // L25: Combina todas as detecções
  setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome);
};
```

#### 🔧 **Service Worker Registration**
```typescript
// Localização: client/src/hooks/use-pwa.ts:66-95
const registerServiceWorker = async () => {
  try {
    // L68-71: Registro do SW
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('PWA: Service Worker registered successfully:', registration); // L73

    // L76-88: Listener para atualizações
    registration.addEventListener('updatefound', () => {
      console.log('PWA: New service worker available');              // L77
      const newWorker = registration.installing;                     // L78
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {            // L81
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) { // L82
            console.log('PWA: New content is available, please refresh'); // L83
          }
        });
      }
    });

    return registration;                                             // L90
  } catch (error) {
    console.error('PWA: Service Worker registration failed:', error); // L92
    return null;                                                     // L93
  }
};
```

#### 🚀 **Instalação PWA**
```typescript
// Localização: client/src/hooks/use-pwa.ts:97-123
const installPWA = async () => {
  if (!deferredPrompt) {                                            // L98
    console.log('PWA: No deferred prompt available');               // L99
    return false;                                                   // L100
  }

  try {
    // L104-105: Mostrar prompt nativo
    await deferredPrompt.prompt();
    
    // L107-108: Aguardar escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: User choice: ${outcome}`);                    // L109

    if (outcome === 'accepted') {                                   // L111
      setIsInstalled(true);                                         // L112
      setIsInstallable(false);                                      // L113
      setDeferredPrompt(null);                                      // L114
      return true;                                                  // L115
    }
    
    return false;                                                   // L118
  } catch (error) {
    console.error('PWA: Installation failed:', error);             // L120
    return false;                                                   // L121
  }
};
```

---

## 🔄 Fluxos Principais

### 🛒 **Fluxo de Criação de Pedido**

<details>
<summary><strong>📋 Mapeamento Linha por Linha do Fluxo</strong></summary>

#### **1. Frontend - Seleção de Produtos**
```typescript
// Localização: client/src/pages/menu.tsx (inferido)
// Usuário adiciona produtos ao carrinho
const addToCart = (product) => {
  setCartItems([...cartItems, product]);
};
```

#### **2. Backend - Endpoint de Criação**
```typescript
// Localização: server/routes.ts:436-539
app.post("/api/orders", async (req, res) => {
  // L439: Extrair itens do body
  const { items, ...orderData } = req.body;
  
  // L441-447: Gerar próximo número de pedido
  const [lastOrder] = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.restaurantId, orderData.restaurantId))
    .orderBy(desc(orders.orderNumber))
    .limit(1);
  
  const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;        // L448
  
  // L451-456: Determinar customer ID
  let customerId = "dev-user-internal";
  if ((req as any).user?.claims?.sub) {
    customerId = (req as any).user.claims.sub;
  } else if ((req as any).session?.user?.id) {
    customerId = (req as any).session.user.id;
  }
  
  // L459-484: Validação de itens
  if (items && items.length > 0) {
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          message: "Invalid item: product ID and positive quantity required" 
        });
      }
      
      // L469-483: Verificar se produto pertence ao restaurante
      const [product] = await db
        .select({ id: products.id, restaurantId: products.restaurantId, stock: products.stock })
        .from(products)
        .where(and(
          eq(products.id, item.productId),
          eq(products.restaurantId, orderData.restaurantId)
        ))
        .limit(1);
        
      if (!product) {
        return res.status(400).json({ 
          message: `Product ${item.productId} not found or doesn't belong to this restaurant` 
        });
      }
    }
  }
  
  // L487-532: Transação para criar pedido e atualizar estoque
  const result = await db.transaction(async (tx) => {
    // L489-499: Criar pedido
    const [order] = await tx
      .insert(orders)
      .values({
        ...orderData,
        customerId: customerId,
        orderNumber: nextOrderNumber,
        status: "pending",
        orderType: orderData.orderType || "delivery",
        paymentMethod: "pix"
      })
      .returning();
    
    // L502-507: Salvar itens do pedido
    if (items && items.length > 0) {
      const orderItemsData = items.map((item: any) => ({
        ...item,
        orderId: order.id
      }));
      await tx.insert(orderItems).values(orderItemsData);
      
      // L510-528: Atualizar estoque de cada produto
      for (const item of items) {
        const [updatedProduct] = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date()
          })
          .where(and(
            eq(products.id, item.productId),
            eq(products.restaurantId, orderData.restaurantId)
          ))
          .returning({ id: products.id, newStock: products.stock });
        
        if (!updatedProduct) {
          throw new Error(`Failed to update stock for product ${item.productId}`);
        }
        
        console.log(`🔄 Stock updated for product ${item.productId}: reduced by ${item.quantity}, new stock: ${updatedProduct.newStock}`);
      }
    }
    
    return order;                                                   // L531
  });
  
  res.json(result);                                                 // L534
});
```

#### **3. WebSocket - Notificação Real-time**
```typescript
// Localização: server/routes.ts (WebSocket setup inferido)
// Após criação do pedido, notificar restaurante via WebSocket
wss.clients.forEach((client) => {
  if (client.userType === 'restaurant' && client.restaurantId === order.restaurantId) {
    client.send(JSON.stringify({
      type: 'new_order',
      order: order
    }));
  }
});
```

#### **4. WhatsApp - Notificação Externa**
```typescript
// Localização: server/whatsappService.ts (inferido)
// Enviar notificação WhatsApp para o restaurante
await whatsappService.sendMessage(restaurant.notificationWhatsapp, {
  message: `🔔 Novo pedido #${order.orderNumber} recebido!`
});
```

</details>

### 💳 **Fluxo de Pagamento PIX**

<details>
<summary><strong>💰 Processo Completo PIX</strong></summary>

#### **1. Seleção de Plano**
```typescript
// Localização: client/src/pages/sales.tsx:274-291
<Button
  onClick={() => {
    // L277: Salvar plano no localStorage
    localStorage.setItem('selectedPlan', plan.name);
    
    // L279: Definir tipo de usuário
    localStorage.setItem('selectedUserType', 'restaurant_owner');
    
    // L281: Redirecionar para setup
    window.location.href = "/setup-restaurant";
  }}
  data-testid={`button-select-${plan.id}`}
>
  {plan.name.toLowerCase() === "trial" ? "Teste Grátis" : "Começar Agora"}
</Button>
```

#### **2. Geração de Pagamento PIX**
```typescript
// Localização: server/routes.ts (endpoint PIX inferido)
app.post("/api/payments/pix", async (req, res) => {
  // Criar pagamento PIX via Asaas
  const pixPayment = await asaas.createPixPayment({
    customer: customerId,
    value: planPrice,
    description: `Assinatura plano ${planName}`,
    externalReference: restaurantId
  });
  
  // Salvar no banco
  const [payment] = await db
    .insert(pixPayments)
    .values({
      restaurantId: restaurantId,
      userId: userId,
      planId: planId,
      amount: planPrice,
      asaasPaymentId: pixPayment.id,
      qrCodePayload: pixPayment.qrCode.payload,
      qrCodeImage: pixPayment.qrCode.encodedImage,
      status: "pending",
      expirationDate: pixPayment.dateCreated
    })
    .returning();
    
  res.json(payment);
});
```

#### **3. Confirmação via Admin**
```typescript
// Localização: client/src/pages/admin-dashboard.tsx:209-231
const confirmPaymentMutation = useMutation({
  mutationFn: (paymentId: string) => 
    apiRequest("POST", `/api/admin/payments/${paymentId}/confirm`, {}),
  onSuccess: () => {
    // L214-217: Invalidar múltiplos caches
    queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    
    // L219-222: Feedback para admin
    toast({
      title: "Pagamento confirmado",
      description: "O pagamento foi confirmado e o plano foi ativado",
    });
  }
});
```

#### **4. Backend - Confirmação Manual**
```typescript
// Localização: server/routes.ts (endpoint confirm inferido)
app.post("/api/admin/payments/:id/confirm", async (req, res) => {
  const paymentId = req.params.id;
  
  // Atualizar status do pagamento
  const [payment] = await db
    .update(pixPayments)
    .set({
      status: "paid",
      paidAt: new Date()
    })
    .where(eq(pixPayments.id, paymentId))
    .returning();
  
  if (payment) {
    // Ativar plano do usuário
    await db
      .update(users)
      .set({
        subscriptionPlan: payment.planId,
        isTrialActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, payment.userId));
      
    // Criar histórico de pagamento
    await db
      .insert(paymentHistory)
      .values({
        restaurantId: payment.restaurantId,
        userId: payment.userId,
        planId: payment.planId,
        pixPaymentId: payment.id,
        amount: payment.amount,
        method: "pix",
        status: "paid",
        paidAt: new Date(),
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      });
  }
  
  res.json({ success: true });
});
```

</details>

---

## 🎨 Componentes UI

### 🧩 **Sistema de Componentes**

<details>
<summary><strong>📦 Mapeamento de Componentes Shadcn/UI</strong></summary>

| 🧩 **Componente** | 📂 **Localização** | 🎯 **Uso Principal** | 📏 **Implementações** |
|------------------|-------------------|---------------------|----------------------|
| 🔘 `Button` | `@/components/ui/button` | Ações universais | 50+ páginas |
| 📄 `Card` | `@/components/ui/card` | Containers | Landing, Dashboard, Admin |
| 📝 `Form` | `@/components/ui/form` | Formulários validados | Register, Setup, Dev |
| 🔤 `Input` | `@/components/ui/input` | Campos de entrada | Todos os forms |
| 🏷️ `Badge` | `@/components/ui/badge` | Status e tags | Admin, Orders, Plans |
| 📊 `Table` | `@/components/ui/table` | Dados tabulares | Admin dashboard |
| 🪟 `Dialog` | `@/components/ui/dialog` | Modais e popups | Admin modals |
| 📑 `Tabs` | `@/components/ui/tabs` | Navegação abas | Admin, Dashboard |
| 🔔 `Toast` | `@/components/ui/toast` | Notificações | Sistema todo |
| 💬 `Tooltip` | `@/components/ui/tooltip` | Dicas contextuais | UI avançada |

</details>

#### 🏪 **Componente RestaurantCard**
```typescript
// Localização: client/src/components/restaurant-card.tsx (inferido)
interface RestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    category: string;
    rating: number;
    deliveryTime: number;
    deliveryFee: number;
    logoUrl?: string;
  };
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative">
        {restaurant.logoUrl ? (
          <img 
            src={restaurant.logoUrl} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {restaurant.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
        <p className="text-muted-foreground text-sm mb-2">{restaurant.category}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">⭐</span>
            <span>{restaurant.rating.toFixed(1)}</span>
          </div>
          
          <div className="text-muted-foreground">
            {restaurant.deliveryTime}min • R$ {restaurant.deliveryFee.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 🎨 **Sistema de Temas**

#### 🌈 **Paleta de Cores CSS**
```css
/* Localização: client/src/index.css */
:root {
  /* 🎨 Brand Colors */
  --primary: 20 14.3% 4.1%;                    /* Quase preto */
  --primary-foreground: 60 9.1% 97.8%;         /* Branco suave */
  
  /* 🎯 Semantic Colors */
  --destructive: 0 62.8% 30.6%;                /* Vermelho erro */
  --warning: 47.9 95.8% 53.1%;                 /* Amarelo aviso */
  --success: 120 60% 50%;                      /* Verde sucesso */
  
  /* 🏠 Surface Colors */
  --background: 0 0% 100%;                     /* Branco puro */
  --card: 0 0% 100%;                          /* Branco cards */
  --border: 20 5.9% 90%;                      /* Cinza claro border */
  --muted: 60 4.8% 95.9%;                     /* Cinza backgrounds */
}

.dark {
  /* 🌙 Dark Mode Overrides */
  --background: 20 14.3% 4.1%;                /* Preto escuro */
  --card: 20 14.3% 4.1%;                      /* Cards escuros */
  --border: 12 6.5% 15.1%;                    /* Borders escuras */
  --muted: 12 6.5% 15.1%;                     /* Muted escuro */
}
```

#### 🎯 **Guidelines de Design**
- ✅ **Consistência**: Sempre usar components Shadcn
- ✅ **Acessibilidade**: Contraste mínimo WCAG AA  
- ✅ **Responsividade**: Mobile-first approach
- ✅ **Performance**: Lazy loading de imagens
- ✅ **Dark Mode**: Suporte completo via CSS variables
- ✅ **Test IDs**: data-testid em todos elementos interativos

---

## ⚙️ Configurações

### 🔧 **Arquivo de Configuração Principal**

#### ⚡ **Vite Config**
```typescript
// Localização: vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),           // L8: Alias para src
      "@shared": path.resolve(__dirname, "./shared"),         // L9: Código compartilhado  
      "@assets": path.resolve(__dirname, "./attached_assets"), // L10: Assets anexados
    }
  },
  server: {
    port: 5000,                                               // L13: Porta dev
    host: "0.0.0.0"                                          // L14: Bind host
  }
});
```

#### 🎨 **Tailwind Config**
```typescript
// Localização: tailwind.config.ts
module.exports = {
  darkMode: ["class"],                                        // L2: Dark mode via class
  content: [
    "./client/src/**/*.{ts,tsx}",                            // L4: Scan frontend
  ],
  theme: {
    extend: {
      colors: {
        // L7-8: CSS variables mapping
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        // ... mais cores
      }
    }
  },
  plugins: [require("tailwindcss-animate")]                   // L15: Animations
}
```

### 🗄️ **Database Config**
```typescript
// Localização: drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",                               // L4: Schema location
  out: "./drizzle",                                          // L5: Migration output
  driver: "pg",                                              // L6: PostgreSQL driver
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,             // L8: Connection string
  },
} satisfies Config;
```

---

## 🧪 Testing & Debug

### 🎯 **Test IDs Mapeados**

<details>
<summary><strong>🔍 Localização de Todos os Test IDs</strong></summary>

#### 🔐 **Página Admin Login** (`/desenvolvedor`)
```typescript
// Localização: client/src/pages/desenvolvedor.tsx
data-testid="admin-login-title"      // L62: Título da página
data-testid="admin-login-subtitle"   // L65: Subtítulo  
data-testid="input-username"         // L85: Campo usuário
data-testid="input-password"         // L101: Campo senha
data-testid="button-admin-login"     // L110: Botão login
```

#### 🏠 **Página Landing** (`/`)
```typescript
// Localização: client/src/pages/landing.tsx
data-testid="link-home"              // L42: Link home
data-testid="link-restaurant-sales"  // L45: Link "Traga seu Restaurante"
data-testid="button-register"        // L54: Botão cadastrar
data-testid="button-login"           // L62: Botão entrar
data-testid="hero-title"             // L91: Título hero
data-testid="hero-subtitle"          // L95: Subtítulo hero
data-testid="input-address-search"   // L107: Campo busca CEP
data-testid="button-search"          // L112: Botão buscar
data-testid="categories-title"       // L177: Título categorias
data-testid="category-{value}"       // L211: Botão categoria (dinâmico)
data-testid="restaurants-title"      // L238: Título restaurantes
data-testid="no-restaurants-message" // L264: Mensagem sem restaurantes
data-testid="cta-title"             // L334: Título CTA
data-testid="cta-subtitle"          // L337: Subtítulo CTA
data-testid="button-bring-restaurant" // L389: Botão cadastrar restaurante
data-testid="button-learn-more"     // L398: Botão saiba mais
```

#### 👨‍💼 **Admin Dashboard** (`/admin-dashboard`)
```typescript
// Localização: client/src/pages/admin-dashboard.tsx
data-testid="admin-dashboard-title"  // L308: Título dashboard
data-testid="admin-user-name"        // L317: Nome do admin
data-testid="button-logout"          // L327: Botão logout
data-testid="tab-dashboard"          // L340: Tab dashboard
data-testid="tab-restaurants"        // L344: Tab restaurantes
data-testid="tab-users"             // L348: Tab usuários
data-testid="tab-plans"             // L352: Tab planos
data-testid="tab-features"          // L356: Tab funcionalidades
data-testid="tab-pagamentos"        // L360: Tab pagamentos
data-testid="stat-total-restaurants" // L375: Métrica restaurantes
data-testid="stat-total-users"       // L390: Métrica usuários
data-testid="stat-total-revenue"     // L405: Métrica receita
data-testid="input-search-restaurants" // L425: Busca restaurantes
data-testid="row-restaurant-{id}"    // L467: Linha restaurante (dinâmico)
data-testid="input-search-users"     // L545: Busca usuários
data-testid="row-user-{id}"         // L576: Linha usuário (dinâmico)
```

#### 📊 **Página Controle** (`/controle`)
```typescript
// Localização: client/src/pages/controle.tsx
data-testid="button-back-to-commands" // L144: Voltar comandas
data-testid="button-logout"          // L163: Logout
data-testid="profit-product-{index}" // L426: Produto lucrativo (dinâmico)
```

#### 🎯 **Página Sales** (`/sales`)
```typescript
// Localização: client/src/pages/sales.tsx
data-testid="button-back"            // L106: Voltar
data-testid="button-header-login"    // L116: Login header
data-testid="hero-title"             // L131: Título hero
data-testid="hero-description"       // L134: Descrição hero
data-testid="features-title"         // L171: Título features
data-testid="feature-{index}"        // L174: Feature (dinâmico)
data-testid="pricing-title"          // L189: Título preços
data-testid="plan-{plan.id}"        // L203: Card plano (dinâmico)
data-testid="button-select-{plan.id}" // L288: Botão selecionar (dinâmico)
```

</details>

### 🔍 **Debug Tools**

#### 📊 **Console Logs Sistemáticos**
```typescript
// WebSocket debugging (use-websocket.ts:67,76,80)
console.log('WebSocket mensagem recebida:', message);
console.log('Autenticado como:', message.userType, message.userId);
console.log('Conectado ao pedido:', message.orderId);

// Auth debugging (routes.ts:115)
console.error("Error in requireRestaurantOwner middleware:", error);

// PWA debugging (use-pwa.ts:73,77,83)
console.log('PWA: Service Worker registered successfully:', registration);
console.log('PWA: New service worker available');
console.log('PWA: New content is available, please refresh');

// Database operations (routes.ts:527)
console.log(`🔄 Stock updated for product ${item.productId}: reduced by ${item.quantity}, new stock: ${updatedProduct.newStock}`);
```

#### 🌐 **Network Monitoring**
```typescript
// Localização: server/index.ts:9-37
app.use((req, res, next) => {
  const start = Date.now();                                  // L10
  const path = req.path;                                     // L11
  
  res.on("finish", () => {
    const duration = Date.now() - start;                     // L21
    if (path.startsWith("/api")) {                           // L22
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`; // L23
      
      if (capturedJsonResponse) {                            // L24
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`; // L25
      }

      if (logLine.length > 80) {                             // L28
        logLine = logLine.slice(0, 79) + "…";                // L29
      }

      log(logLine);                                          // L32
    }
  });
  
  next();                                                    // L36
});
```

---

## 🔐 Segurança

### 🛡️ **Matriz de Controle de Acesso**

| 👤 **Role** | 🔐 **Auth Method** | 📱 **Pages Permitidas** | 🔗 **API Access** |
|-------------|-------------------|------------------------|--------------------|
| **👤 Customer** | Replit Auth | `/`, `/menu/:id`, `/customer-panel` | `/api/customer/*`, `/api/orders` (próprios) |
| **🍴 Restaurant Owner** | Replit Auth | `/restaurant-panel`, `/dashboard`, `/controle` | `/api/my-*`, `/api/restaurants/*` (próprio) |
| **👨‍💼 Employee** | Local Auth (username/password) | `/dashboard` (limitado por `permissions[]`) | Baseado em array `permissions` |
| **🛡️ Admin** | Username/Password | `/admin-dashboard` | `/api/admin/*` (acesso total) |
| **🌐 Anonymous** | Nenhuma | `/`, `/menu/:id`, `/sales`, `/register` | `/api/restaurants` (público) |

### 🔒 **Implementação de Autenticação**

#### 🛡️ **Middleware requireRestaurantOwner**
```typescript
// Localização: server/routes.ts:60-118
const requireRestaurantOwner = async (req: any, res: any, next: any) => {
  try {
    let userId = null;

    // L65-73: Resolver user ID (dev vs produção)
    if (process.env.NODE_ENV === "development") {
      userId = req.user?.claims?.sub || "dev-user-internal";
    } else {
      if (!(req.session as any)?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      userId = (req.session as any).user.id;
    }

    // L76-84: Verificar usuário existe e tem role correto
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // L87-89: Verificação de role
    if (user.role !== "restaurant_owner") {
      return res.status(403).json({ message: "Access denied. Restaurant owner role required." });
    }

    // L92-102: Mapear para restaurante e adicionar contexto
    const actualOwnerId = (userId === "dev-user-internal" && process.env.NODE_ENV === "development") 
      ? "dev-user-123" 
      : userId;

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, actualOwnerId))
      .orderBy(desc(restaurants.createdAt))
      .limit(1);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found for this owner" });
    }

    // L109-111: Adicionar à requisição
    req.restaurant = restaurant;
    req.userId = userId;
    req.actualOwnerId = actualOwnerId;
    
    next();
  } catch (error) {
    console.error("Error in requireRestaurantOwner middleware:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};
```

### 🔑 **Variáveis de Ambiente Críticas**

```bash
# 🔐 Autenticação
DATABASE_URL=                        # Conexão PostgreSQL
SESSION_SECRET=                      # Chave para sessões
REPLIT_DB_URL=                       # Auth base Replit

# 💳 Pagamentos  
STRIPE_SECRET_KEY=                   # Stripe backend
VITE_STRIPE_PUBLIC_KEY=              # Stripe frontend  
ASAAS_API_KEY=                       # PIX payments (Asaas)

# 📞 Integrações
WHATSAPP_API_URL=                    # Evolution API endpoint
WHATSAPP_API_KEY=                    # WhatsApp API key

# ⚙️ Sistema
NODE_ENV=development|production      # Ambiente
PORT=3000                           # Porta do servidor
```

---

## 🛠️ Troubleshooting

### ❌ **Problemas Comuns e Soluções**

<details>
<summary><strong>🗄️ Database Issues</strong></summary>

#### **Migration Errors**
```bash
# ❌ Problema: Schema out of sync
Error: relation "new_table" does not exist

# ✅ Solução:
npm run db:push --force

# 🔍 Debug: Verificar schema atual
psql $DATABASE_URL -c "\dt"
```

#### **Connection Issues**  
```bash
# ❌ Problema: Cannot connect
ECONNREFUSED 127.0.0.1:5432

# ✅ Verificações:
echo $DATABASE_URL                   # Verificar URL
psql $DATABASE_URL -c "SELECT 1;"   # Testar conexão direta
```

</details>

<details>
<summary><strong>🔐 Auth Problems</strong></summary>

#### **Dev User Issues**
```typescript
// ❌ Problema: Dev auth não funciona
// server/routes.ts:66
userId = req.user?.claims?.sub || "dev-user-internal";

// ✅ Verificar:
console.log('NODE_ENV:', process.env.NODE_ENV);  // Deve ser "development"
console.log('User ID resolved:', userId);        // Deve ser "dev-user-internal"

// ✅ Mapear corretamente:
// server/routes.ts:92-94
const actualOwnerId = (userId === "dev-user-internal" && process.env.NODE_ENV === "development") 
  ? "dev-user-123"  // Mapeia para dev user no banco
  : userId;
```

#### **Session Expired**
```bash
# ❌ Problema: Authentication required
# ✅ Soluções:
# 1. Limpar cookies do browser
# 2. Restart do servidor
# 3. Verificar SESSION_SECRET
```

</details>

<details>
<summary><strong>📱 PWA Problems</strong></summary>

#### **Service Worker Not Registering**
```typescript
// ❌ Problema: SW registration failed
// ✅ Verificar:
// 1. Arquivo existe: public/sw.js
// 2. HTTPS em produção
// 3. Scope correto

// Localização: client/src/hooks/use-pwa.ts:68-71
const registration = await navigator.serviceWorker.register('/sw.js', {
  scope: '/',
  updateViaCache: 'none'
});
```

#### **Install Prompt Not Showing**
```typescript
// ❌ Problema: beforeinstallprompt não dispara
// ✅ Requisitos:
// 1. HTTPS (obrigatório em produção)
// 2. Manifest.json válido
// 3. Service Worker ativo  
// 4. Não instalado anteriormente
// 5. Critérios de engajamento atendidos

// Localização: client/src/hooks/use-pwa.ts:36-41
const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault();
  const promptEvent = e as BeforeInstallPromptEvent;
  setDeferredPrompt(promptEvent);
  setIsInstallable(true);
};
```

</details>

<details>
<summary><strong>💳 Payment Issues</strong></summary>

#### **Stripe Not Configured**
```bash
# ❌ Problema: "Sistema de Pagamento não Configurado"
# client/src/pages/subscribe.tsx:75-101

# ✅ Verificar env vars:
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# ✅ Verificar loadStripe:
# client/src/pages/subscribe.tsx:11-12
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null;
```

#### **PIX Status Not Updating**
```bash
# ❌ Problema: PIX fica "pending"
# ✅ Verificações:
# 1. Webhook Asaas configurado
# 2. URL correta: /api/webhook/asaas
# 3. Confirmation manual via admin

# Admin confirmation:
# client/src/pages/admin-dashboard.tsx:209-231
confirmPaymentMutation.mutate(paymentId);
```

</details>

### 🔧 **Comandos de Debug Úteis**

```bash
# 🗄️ Database inspection
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
psql $DATABASE_URL -c "SELECT * FROM users WHERE role='restaurant_owner' LIMIT 3;"
psql $DATABASE_URL -c "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"

# 📦 Node.js debugging  
npm ls                              # Verificar dependências
npm run build 2>&1 | head -20      # Erros de build
node -v && npm -v                   # Versões

# 🧹 Clean reset
rm -rf node_modules package-lock.json
npm install
npm run db:push --force

# 📱 PWA debugging (Browser DevTools)
# Application > Service Workers
# Application > Storage > Clear storage
# Network > Preserve log
```

---

## 📚 **Cheat Sheet para Desenvolvimento**

### ⚡ **Comandos Essenciais**
```bash
# 🚀 Desenvolvimento
npm run dev                         # Servidor completo (frontend + backend)
npm run build                       # Build de produção
npm run preview                     # Preview do build

# 🗄️ Database
npm run db:push                     # Sync schema (seguro)
npm run db:push --force            # Force sync (⚠️ pode perder dados)
node scripts/seed-dev-data.js      # Popular dados de teste

# 🧪 Debug
npm run build 2>&1 | grep ERROR   # Erros de build
psql $DATABASE_URL                 # Acesso direto ao banco
```

### 🔍 **Busca Rápida por Funcionalidade**

| 🎯 **Quero implementar...** | 📁 **Arquivo** | 📏 **Linha** |
|----------------------------|---------------|-------------|
| Nova página | `client/src/App.tsx` | 25-42 |
| Nova API | `server/routes.ts` | 52+ |
| Nova tabela | `shared/schema.ts` | final do arquivo |
| Novo componente | `client/src/components/` | novo arquivo |
| Auth middleware | `server/routes.ts` | 60-118 |
| WebSocket handler | `client/src/hooks/use-websocket.ts` | 70-128 |
| PWA feature | `client/src/hooks/use-pwa.ts` | 97-123 |
| Admin function | `client/src/pages/admin-dashboard.tsx` | 209+ |

---

<div align="center">

**🚀 Manual Completo GoFood Platform**

*Mapeamento Linha por Linha - Versão 2025*

---

**📍 Navegação Rápida por Arquivo**
*Use Ctrl+F + nome do arquivo para localizar rapidamente*

**🔧 Para Modificações:**
1. ✅ Verificar localização exata no manual
2. ✅ Ler contexto nas linhas indicadas  
3. ✅ Implementar mudança
4. ✅ Testar localmente
5. ✅ Atualizar manual se necessário

</div>