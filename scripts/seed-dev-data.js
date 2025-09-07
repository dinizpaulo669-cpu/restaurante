import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { restaurants, products, categories, users } from '../shared/schema.js';

const { Pool } = pg;

// Usar DATABASE_URL se disponível
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL ou SUPABASE_URL deve estar configurado');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString: connectionString,
  ssl: connectionString.includes('supabase') ? {
    rejectUnauthorized: false
  } : false
});

const db = drizzle({ client: pool });

async function seedData() {
  try {
    console.log('Inserindo dados de desenvolvimento...');

    // Inserir usuário de desenvolvimento
    await db.insert(users).values({
      id: "dev-user-123",
      email: "dev@restaurant.com",
      firstName: "Restaurante",
      lastName: "Teste",
      role: "restaurant_owner"
    }).onConflictDoNothing();

    // Inserir restaurante de desenvolvimento
    const [restaurant] = await db.insert(restaurants).values({
      id: "rest-dev-123",
      ownerId: "dev-user-123",
      name: "Restaurante Teste",
      description: "Restaurante para testes de desenvolvimento",
      category: "Brasileira",
      address: "Rua do Teste, 123 - São Paulo, SP",
      phone: "(11) 99999-9999",
      email: "contato@teste.com",
      rating: 4.5,
      deliveryFee: 5.00,
      minDeliveryTime: 20,
      maxDeliveryTime: 40,
      isActive: true,
      openingTime: "11:00",
      closingTime: "23:00"
    }).onConflictDoNothing().returning();

    console.log('Restaurante criado:', restaurant);

    // Inserir categorias
    const [category1] = await db.insert(categories).values({
      id: "cat-1",
      restaurantId: "rest-dev-123",
      name: "Pratos Principais",
      description: "Principais pratos do cardápio",
      sortOrder: 1
    }).onConflictDoNothing().returning();

    const [category2] = await db.insert(categories).values({
      id: "cat-2", 
      restaurantId: "rest-dev-123",
      name: "Bebidas",
      description: "Bebidas e sucos",
      sortOrder: 2
    }).onConflictDoNothing().returning();

    console.log('Categorias criadas');

    // Inserir produtos de exemplo
    await db.insert(products).values([
      {
        id: "prod-1",
        restaurantId: "rest-dev-123",
        categoryId: "cat-1",
        name: "Hambúrguer Artesanal",
        description: "Hambúrguer com pão artesanal, blend 180g, queijo, alface e tomate",
        price: 25.90,
        costPrice: 12.00,
        stock: 50,
        preparationTime: 20,
        isActive: true,
        availabilityType: "local_and_delivery",
        sortOrder: 1
      },
      {
        id: "prod-2",
        restaurantId: "rest-dev-123", 
        categoryId: "cat-1",
        name: "Pizza Margherita",
        description: "Pizza tradicional com molho, mussarela e manjericão",
        price: 32.90,
        costPrice: 15.00,
        stock: 30,
        preparationTime: 25,
        isActive: true,
        availabilityType: "local_and_delivery",
        sortOrder: 2
      },
      {
        id: "prod-3",
        restaurantId: "rest-dev-123",
        categoryId: "cat-2", 
        name: "Suco de Laranja",
        description: "Suco natural de laranja 300ml",
        price: 8.90,
        costPrice: 3.00,
        stock: 100,
        preparationTime: 5,
        isActive: true,
        availabilityType: "local_and_delivery",
        sortOrder: 1
      }
    ]).onConflictDoNothing();

    console.log('Produtos criados com sucesso!');

    // Inserir mais alguns restaurantes para a busca
    await db.insert(restaurants).values([
      {
        id: "rest-2",
        ownerId: "dev-user-456",
        name: "Pizzaria Italiana", 
        description: "Autêntica pizzaria italiana com receitas tradicionais",
        category: "Italiana",
        address: "Av. Paulista, 1000 - São Paulo, SP",
        phone: "(11) 88888-8888",
        email: "contato@pizzaria.com",
        rating: 4.7,
        deliveryFee: 6.00,
        minDeliveryTime: 25,
        maxDeliveryTime: 45,
        isActive: true,
        openingTime: "18:00",
        closingTime: "00:00"
      },
      {
        id: "rest-3",
        ownerId: "dev-user-789",
        name: "Sushi Express",
        description: "Sushi e comida japonesa de qualidade com entrega rápida", 
        category: "Japonesa",
        address: "Rua da Liberdade, 500 - São Paulo, SP",
        phone: "(11) 77777-7777",
        email: "contato@sushi.com",
        rating: 4.3,
        deliveryFee: 4.50,
        minDeliveryTime: 15,
        maxDeliveryTime: 35,
        isActive: true,
        openingTime: "11:30",
        closingTime: "22:30"
      }
    ]).onConflictDoNothing();

    console.log('Restaurantes adicionais criados!');

  } catch (error) {
    console.error('Erro ao inserir dados:', error);
  } finally {
    await pool.end();
  }
}

seedData();