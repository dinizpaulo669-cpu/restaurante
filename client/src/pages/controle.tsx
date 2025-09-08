import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Calendar,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar, BarChart, Cell, PieChart as RechartsPieChart, Pie } from "recharts";

export default function ControlePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ 
    username: '', 
    password: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 7d, 30d, 3m, 1y

  // Mock login - em produção seria uma API real
  const handleLogin = () => {
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Credenciais inválidas. Use admin/admin123');
    }
  };

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/dev/orders"],
    enabled: isAuthenticated
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/dev/products"],
    enabled: isAuthenticated
  });

  // Dados mockados para o dashboard
  const salesData = [
    { date: '01/01', vendas: 1200, pedidos: 24 },
    { date: '02/01', vendas: 1500, pedidos: 28 },
    { date: '03/01', vendas: 1100, pedidos: 22 },
    { date: '04/01', vendas: 1800, pedidos: 32 },
    { date: '05/01', vendas: 2100, pedidos: 38 },
    { date: '06/01', vendas: 1900, pedidos: 35 },
    { date: '07/01', vendas: 2300, pedidos: 41 },
  ];

  const topProducts = [
    { name: 'X-Burger', vendas: 120, receita: 1800 },
    { name: 'Pizza Margherita', vendas: 95, receita: 1520 },
    { name: 'Refrigerante', vendas: 200, receita: 800 },
    { name: 'Batata Frita', vendas: 80, receita: 640 },
    { name: 'Hambúrguer Bacon', vendas: 65, receita: 1300 },
  ];

  const categoryData = [
    { name: 'Lanches', value: 45, color: '#ff6384' },
    { name: 'Pizzas', value: 30, color: '#36a2eb' },
    { name: 'Bebidas', value: 15, color: '#ffce56' },
    { name: 'Acompanhamentos', value: 10, color: '#4bc0c0' },
  ];

  const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0);
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              RestaurantePro
            </CardTitle>
            <CardDescription>
              Painel de Controle Administrativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Digite seu usuário"
                data-testid="input-username"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite sua senha"
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={!loginData.username || !loginData.password}
              data-testid="button-login"
            >
              Entrar
            </Button>
            
            <div className="text-center text-sm text-muted-foreground mt-4 p-3 bg-blue-50 rounded-lg">
              <p><strong>Credenciais de teste:</strong></p>
              <p>Usuário: admin</p>
              <p>Senha: admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Painel de Controle
              </h1>
              <p className="text-gray-600">Dashboard administrativo completo</p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="1y">Último ano</option>
              </select>
              <Button 
                variant="outline" 
                onClick={() => setIsAuthenticated(false)}
                data-testid="button-logout"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    +12% vs mês anterior
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {orders.length}
                  </p>
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    +8% vs mês anterior
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  <p className="text-3xl font-bold text-purple-600">
                    R$ {averageTicket.toFixed(2)}
                  </p>
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <ArrowDown className="w-4 h-4 mr-1" />
                    -3% vs mês anterior
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {products.length}
                  </p>
                  <p className="text-sm text-orange-600 flex items-center mt-1">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    +2 novos produtos
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Vendas ao longo do tempo */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Vendas por Período
              </CardTitle>
              <CardDescription>
                Receita e número de pedidos nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Receita (R$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vendas por categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Vendas por Categoria
              </CardTitle>
              <CardDescription>
                Distribuição das vendas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>
              Ranking dos produtos com melhor performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.vendas} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">R$ {product.receita.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">receita total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}