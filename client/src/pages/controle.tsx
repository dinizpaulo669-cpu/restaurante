import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  ArrowLeft
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar, BarChart, Cell, PieChart as RechartsPieChart, Pie } from "recharts";
import { PWAInstall } from "@/components/pwa-install";

export default function ControlePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 7d, 30d, 3m, 1y

  // Auto-redirect para login se não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Função de logout adequada
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo se der erro, redireciona para login
      navigate('/login');
    }
  };

  // Buscar restaurante do usuário logado primeiro
  const { data: userRestaurant } = useQuery<any>({
    queryKey: ["/api/my-restaurant"],
    enabled: isAuthenticated
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/my-orders"],
    enabled: isAuthenticated
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/restaurants", userRestaurant?.id, "products"],
    enabled: isAuthenticated && !!userRestaurant?.id
  });

  // Buscar estatísticas reais do restaurante
  const { data: restaurantStats } = useQuery<any>({
    queryKey: ["/api/restaurant/stats"],
    enabled: isAuthenticated
  });

  // Buscar relatório de lucro
  const { data: profitReport } = useQuery<any>({
    queryKey: ["/api/restaurant/profit-report"],
    enabled: isAuthenticated
  });

  // Usar apenas dados reais das estatísticas
  const salesData = restaurantStats?.salesByDay || [];

  const topProducts = restaurantStats?.topProducts?.map((product: any) => ({
    name: product.productName || 'Produto',
    vendas: Number(product.totalSold || 0),
    receita: Number(product.totalRevenue || 0)
  })) || [];

  const categoryData = restaurantStats?.categoryStats?.map((category: any, index: number) => {
    const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'];
    return {
      name: category.category || 'Categoria',
      value: Number(category.count || 0),
      color: colors[index % colors.length]
    };
  }) || [];

  const totalRevenue = restaurantStats?.totalRevenue || 0;
  const averageTicket = restaurantStats?.averageTicket || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Carregando painel de controle...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Redirecionando para o login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Painel de Controle
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Dashboard administrativo completo</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard?tab=comandas')}
                data-testid="button-back-to-commands"
                className="w-full sm:w-auto flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Comandas
              </Button>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="1y">Último ano</option>
              </select>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                data-testid="button-logout"
                className="w-full sm:w-auto"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* PWA Install Component */}
        <PWAInstall />

        {/* Métricas principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
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
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {restaurantStats?.totalOrders || orders.length}
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
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">
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
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">
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

        {/* Relatório de Lucro */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Relatório de Lucro</h2>
            <p className="text-gray-600">Análise detalhada da rentabilidade baseada nos preços de venda e custo dos produtos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {/* Lucro Total */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lucro Total</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">
                      R$ {(profitReport?.totalProfit?.totalProfit || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      Pedidos entregues
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Margem de Lucro */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Margem de Lucro</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {(profitReport?.totalProfit?.profitMargin || 0).toFixed(1)}%
                    </p>
                    <p className="text-sm text-blue-600 flex items-center mt-1">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      Rentabilidade
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custo Total */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Custo Total</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600">
                      R$ {(profitReport?.totalProfit?.totalCost || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <ArrowDown className="w-4 h-4 mr-1" />
                      Gastos com produtos
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ROI */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ROI</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                      {profitReport?.totalProfit?.totalCost > 0 
                        ? ((profitReport?.totalProfit?.totalProfit || 0) / (profitReport?.totalProfit?.totalCost || 1) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-sm text-purple-600 flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Retorno sobre custo
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Lucro por Período */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Lucro por Período
                </CardTitle>
                <CardDescription>
                  Evolução do lucro nos últimos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(profitReport?.profitByDay && profitReport.profitByDay.length > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={profitReport.profitByDay}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `R$ ${Number(value).toFixed(2)}`, 
                          name === 'totalProfit' ? 'Lucro' : 
                          name === 'totalRevenue' ? 'Receita' : 'Custo'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalProfit" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        name="Lucro"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalRevenue" 
                        stroke="#3b82f6" 
                        strokeWidth={1}
                        name="Receita"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalCost" 
                        stroke="#ef4444" 
                        strokeWidth={1}
                        name="Custo"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Nenhum dado de lucro ainda</p>
                      <p className="text-sm">Dados aparecerão conforme você realizar vendas</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Produtos por Lucro */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Lucrativos</CardTitle>
                <CardDescription>
                  Ranking dos produtos com maior lucro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(profitReport?.profitByProduct && profitReport.profitByProduct.length > 0) ? (
                    profitReport.profitByProduct.slice(0, 5).map((product: any, index: number) => (
                      <div key={product.productId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg" data-testid={`profit-product-${index}`}>
                        <div className="flex items-center space-x-4">
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-gray-600">
                              {product.totalQuantitySold} vendas • Margem: {product.profitMargin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">R$ {product.totalProfit.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">lucro total</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum produto vendido ainda</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
              {(salesData && salesData.length > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
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
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhuma venda ainda</p>
                    <p className="text-sm">Dados aparecerão conforme você realizar vendas</p>
                  </div>
                </div>
              )}
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
              {(categoryData && categoryData.length > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
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
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhuma venda por categoria</p>
                    <p className="text-sm">Dados aparecerão conforme você realizar vendas</p>
                  </div>
                </div>
              )}
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
              {(topProducts && topProducts.length > 0) ? (
                topProducts.map((product: any, index: number) => (
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
                ))
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum produto vendido ainda</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}