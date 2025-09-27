# Manual do Desenvolvedor - Sistema de Delivery/Restaurante

## Visão Geral do Projeto

Este é um sistema completo de delivery/restaurante desenvolvido em TypeScript, utilizando React no frontend e Express.js no backend, com banco de dados PostgreSQL via Drizzle ORM.

### Tecnologias Principais
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Shadcn/UI
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Banco de Dados**: PostgreSQL (Neon)
- **Autenticação**: Replit Auth + sistema local para funcionários
- **Validação**: Zod para schemas
- **Realtime**: WebSockets
- **Upload de Arquivos**: Multer
- **Notificações**: WhatsApp via Evolution API

---

## Estrutura do Projeto

```
.
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── hooks/        # Hooks customizados
│   │   ├── lib/          # Utilitários e configurações
│   │   └── pages/        # Páginas da aplicação
├── server/               # Backend Express
├── shared/               # Código compartilhado
└── scripts/              # Scripts utilitários
```

---

## 1. SHARED - ESQUEMAS E TIPOS

### Arquivo: `shared/schema.ts`

Este é o arquivo central que define toda a estrutura do banco de dados e tipos TypeScript.

#### Tabelas Principais:

**1. `users` - Usuários do Sistema**
```typescript
// Localização: linha 28-48
```
- **Função**: Armazena dados de usuários (clientes, proprietários, funcionários)
- **Campos principais**: 
  - `id`: ID único (UUID)
  - `role`: "customer" | "restaurant_owner" | "employee"
  - `stripeCustomerId/subscriptionId`: Para pagamentos
  - `restaurantId`: Para funcionários (referência ao restaurante)
- **Relações**: Um-para-muitos com restaurantes e pedidos

**2. `restaurants` - Restaurantes**
```typescript
// Localização: linha 51-79
```
- **Função**: Dados dos restaurantes cadastrados
- **Campos importantes**:
  - `ownerId`: Referência ao proprietário
  - `category`: Categoria do restaurante
  - `deliveryFee`: Taxa de entrega
  - `openingHours`: Horários de funcionamento (JSON)
  - `whatsappNumber`: Para notificações
- **Relações**: Pertence a um usuário, tem muitos produtos/pedidos

**3. `products` - Produtos/Pratos**
```typescript
// Localização: linha 93-112
```
- **Função**: Cardápio dos restaurantes
- **Campos importantes**:
  - `availabilityType`: "local_only" | "local_and_delivery"
  - `stock`: Controle de estoque
  - `preparationTime`: Tempo de preparo
- **Relações**: Pertence a restaurante e categoria

**4. `orders` - Pedidos**
```typescript
// Localização: linha 175-195
```
- **Função**: Gerenciar pedidos dos clientes
- **Status possíveis**: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled"
- **Tipos**: "delivery" | "pickup" | "table"

#### Schemas de Validação:
- **insertUserSchema**: Validação para criação de usuários
- **insertRestaurantSchema**: Validação para restaurantes
- **insertProductSchema**: Validação para produtos (com transformações de tipos)
- **insertOrderSchema**: Validação para pedidos

---

## 2. BACKEND - SERVIDOR EXPRESS

### Arquivo: `server/index.ts`

**Função Principal**: Configuração do servidor Express e middleware

#### Principais Funções:

**1. Configuração de Middleware**
```typescript
// Localização: linha 9-37
app.use((req, res, next) => {
  // Middleware de logging para APIs
  // Captura respostas JSON e mede tempo de resposta
});
```

**2. Configuração do Servidor**
```typescript
// Localização: linha 39-82
```
- Registra rotas da API
- Configura Vite para desenvolvimento
- Serve arquivos estáticos em produção
- Inicia servidor na porta especificada

### Arquivo: `server/routes.ts`

**Função Principal**: Define todas as rotas da API

#### Configuração de Upload:
```typescript
// Localização: linha 17-50
const multerStorage = multer.diskStorage({
  // Configuração para upload de imagens de restaurantes e produtos
});
```

#### Middleware de Autenticação:
```typescript
// Localização: linha 60-118
const requireRestaurantOwner = async (req, res, next) => {
  // Verifica se usuário é proprietário de restaurante
  // Busca restaurante associado ao usuário
  // Adiciona dados do restaurante à requisição
};
```

#### Principais Grupos de Rotas:

**1. ROTAS DE AUTENTICAÇÃO**
- `GET /api/auth/user` - Busca dados do usuário autenticado
- `GET /api/dev/auth/user` - Versão de desenvolvimento

**2. ROTAS DE RESTAURANTES**
```typescript
// Localização: linha 154-385
```
- `GET /api/restaurants` - Lista restaurantes (com busca por CEP/nome)
- `GET /api/restaurants/:id` - Detalhes de um restaurante
- `POST /api/restaurants` - Criar novo restaurante
- `GET /api/my-restaurant` - Restaurante do usuário logado

**3. ROTAS DE PRODUTOS**
```typescript
// Localização: linha 387-433
```
- `GET /api/restaurants/:id/products` - Produtos do restaurante
- `GET /api/restaurants/:id/categories` - Categorias do restaurante

**4. ROTAS DE PEDIDOS**
```typescript
// Localização: linha 435-616
```
- `POST /api/orders` - Criar novo pedido
- `GET /api/customer/orders` - Pedidos do cliente

#### Funcionalidades Especiais:

**1. Busca por CEP**
```typescript
// Localização: linha 160-224
// Integração com ViaCEP para buscar restaurantes por localização
```

**2. Controle de Estoque**
```typescript
// Localização: linha 509-528
// Atualiza estoque automaticamente ao criar pedidos
```

### Arquivo: `server/db.ts`

**Função**: Configuração da conexão com banco PostgreSQL
- Usa Drizzle ORM
- Configuração via variável `DATABASE_URL`

### Arquivo: `server/replitAuth.ts`

**Função**: Gerencia autenticação Replit e sistema local
- Configura sessões
- Middleware de autenticação
- Fallback para desenvolvimento

### Arquivo: `server/whatsappService.ts`

**Função**: Integração com WhatsApp via Evolution API
- Envio de notificações de pedidos
- Configuração de webhook

---

## 3. FRONTEND - APLICAÇÃO REACT

### Arquivo: `client/src/App.tsx`

**Função Principal**: Configuração das rotas da aplicação

#### Rotas Disponíveis:
- `/` - Página inicial
- `/login` - Login de usuários
- `/register` - Cadastro de usuários  
- `/customer-panel` - Painel do cliente
- `/restaurant-panel` - Painel do restaurante
- `/restaurant/:restaurantId` - Menu público do restaurante
- `/admin-dashboard` - Dashboard administrativo

### Arquivo: `client/src/lib/queryClient.ts`

**Função**: Configuração do TanStack Query para gerenciamento de estado

#### Principais Funções:

**1. `apiRequest`**
```typescript
// Localização: linha 10-24
// Função para fazer requisições HTTP com tratamento de erros
```

**2. `getQueryFn`**
```typescript
// Localização: linha 27-63
// Query function padrão com suporte a parâmetros de busca
```

### Estrutura de Páginas:

#### `client/src/pages/`

**1. `landing.tsx`** - Página inicial para usuários não logados
**2. `login.tsx`** - Tela de login com seleção de tipo de usuário
**3. `customer-panel.tsx`** - Dashboard do cliente com histórico de pedidos
**4. `restaurant-panel.tsx`** - Dashboard do restaurante para gerenciar pedidos
**5. `menu.tsx`** - Cardápio público do restaurante
**6. `admin-dashboard.tsx`** - Painel administrativo do sistema

### Hooks Customizados:

#### `client/src/hooks/`

**1. `use-websocket.ts`** 
- Gerencia conexões WebSocket para atualizações em tempo real
- Usado para notificar novos pedidos

**2. `use-pwa.ts`**
- Funcionalidades de PWA (Progressive Web App)
- Gerencia service worker e instalação

**3. `use-toast.ts`**
- Sistema de notificações/alertas para o usuário

**4. `use-mobile.tsx`**
- Detecta se está em dispositivo móvel

### Componentes Principais:

#### `client/src/components/`

**1. Componentes de UI** (`ui/`)
- Baseados em Shadcn/UI e Radix
- Componentes reutilizáveis: Button, Card, Dialog, Form, etc.

**2. Componentes de Negócio**
- `dashboard-layout.tsx` - Layout do dashboard do restaurante
- `order-card.tsx` - Cartão de exibição de pedidos
- `product-card.tsx` - Cartão de produtos no menu
- `restaurant-card.tsx` - Cartão de restaurante na listagem

---

## 4. FLUXOS PRINCIPAIS DO SISTEMA

### 4.1 Fluxo de Cadastro de Restaurante

1. **Registro**: `POST /api/restaurants`
   - Arquivo: `server/routes.ts` (linha 287-335)
   - Cria usuário como "restaurant_owner"
   - Inicia período trial

2. **Setup**: Página `/setup-restaurant`
   - Configuração inicial do restaurante
   - Upload de logo e banner

### 4.2 Fluxo de Pedidos

1. **Criação**: `POST /api/orders`
   - Arquivo: `server/routes.ts` (linha 436-539)
   - Valida produtos
   - Atualiza estoque
   - Gera número sequencial

2. **Notificação**: WebSocket + WhatsApp
   - Notifica restaurante em tempo real
   - Envia mensagem WhatsApp (se configurado)

### 4.3 Fluxo de Busca

1. **Por CEP**: Integração ViaCEP
   - Arquivo: `server/routes.ts` (linha 164-214)
   - Busca áreas de entrega compatíveis

2. **Por Nome/Categoria**: Busca textual
   - Arquivo: `server/routes.ts` (linha 224-232)

---

## 5. CONFIGURAÇÕES E VARIÁVEIS

### Variáveis de Ambiente Importantes:

```bash
DATABASE_URL=           # URL do PostgreSQL
NODE_ENV=              # development/production
PORT=                  # Porta do servidor (padrão: 3000)
WHATSAPP_API_URL=      # URL da Evolution API
WHATSAPP_API_KEY=      # Chave da Evolution API
```

### Arquivos de Configuração:

1. **`package.json`** - Dependências e scripts
2. **`vite.config.ts`** - Configuração do Vite
3. **`tailwind.config.ts`** - Configuração do TailwindCSS
4. **`drizzle.config.ts`** - Configuração do Drizzle ORM

---

## 6. COMANDOS ÚTEIS

### Desenvolvimento:
```bash
npm run dev              # Inicia servidor de desenvolvimento
npm run build           # Build para produção
npm run db:push         # Sincroniza schema com banco
npm run db:push --force # Força sincronização (data loss warning)
```

### Scripts Personalizados:
```bash
node scripts/seed-dev-data.js  # Popula banco com dados de teste
```

---

## 7. PADRÕES DE CÓDIGO

### 7.1 Validação de Dados
- Usar schemas Zod importados de `@shared/schema`
- Validar no backend antes de operações de banco
- Transformar tipos quando necessário (string ↔ number)

### 7.2 Tratamento de Erros
- Sempre usar try/catch em rotas async
- Retornar mensagens de erro estruturadas
- Log detalhado no console para debug

### 7.3 Queries do Banco
- Usar Drizzle ORM query builder
- Aplicar filtros com `and()`, `or()`, `eq()`
- Usar `limit()` para evitar queries pesadas

### 7.4 Frontend
- Usar TanStack Query para cache de dados
- Invalidar cache após mutations
- Componentes com `data-testid` para testes

---

## 8. PONTOS DE ATENÇÃO

### 8.1 Segurança
- Middleware `requireRestaurantOwner` protege rotas sensíveis
- Upload de arquivos limitado a imagens (5MB)
- Validação de propriedade de recursos (restaurante/produtos)

### 8.2 Performance
- Cache infinito no TanStack Query
- Paginação em listagens grandes
- Índices no banco para buscas frequentes

### 8.3 Desenvolvimento vs Produção
- User ID "dev-user-internal" em desenvolvimento
- Autenticação simplificada para dev
- Logs detalhados apenas em desenvolvimento

---

## 9. TROUBLESHOOTING COMUM

### 9.1 Problemas de Banco
- **Migration errors**: Use `npm run db:push --force`
- **Schema mismatch**: Verifique `shared/schema.ts`
- **Connection issues**: Verifique `DATABASE_URL`

### 9.2 Problemas de Upload
- **Files not saving**: Verificar permissões da pasta `public/uploads`
- **File too large**: Limite é 5MB (configurável no multer)

### 9.3 Problemas de Auth
- **Dev user not working**: Verificar `NODE_ENV=development`
- **Session issues**: Limpar cookies/localStorage

---

## 10. PRÓXIMOS DESENVOLVIMENTOS

### 10.1 Funcionalidades Planejadas
- Sistema de cupons mais avançado
- Relatórios e analytics
- App mobile nativo
- Integração com mais gateways de pagamento

### 10.2 Melhorias Técnicas
- Testes automatizados
- CI/CD pipeline
- Monitoring e alertas
- Cache Redis para sessões

---

## Conclusão

Este manual mapeia todas as principais funções e arquivos do sistema. Para modificações futuras:

1. **Sempre valide** no `shared/schema.ts` primeiro
2. **Atualize as rotas** em `server/routes.ts`
3. **Teste** localmente antes de deploy
4. **Documente** mudanças importantes neste manual

Para dúvidas específicas sobre implementação, consulte os comentários no código ou a documentação das bibliotecas utilizadas.