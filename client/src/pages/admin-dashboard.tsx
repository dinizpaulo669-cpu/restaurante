import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  LogOut, 
  Users, 
  Store, 
  Package, 
  TrendingUp, 
  Search,
  Plus,
  Edit,
  Trash2,
  Settings,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Cog
} from "lucide-react";

import PlanModal from "@/components/admin/PlanModal";
import FeatureModal from "@/components/admin/FeatureModal";
import PlanFeaturesModal from "@/components/admin/PlanFeaturesModal";

interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface DashboardStats {
  totalRestaurants: number;
  totalUsers: number;
  totalOrders: number;
  activeRestaurants: number;
  trialUsers: number;
  totalRevenue: number;
}

interface Restaurant {
  restaurant: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
  };
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionPlan: string;
    isTrialActive: boolean;
    trialEndsAt: string | null;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  subscriptionPlan: string;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  createdAt: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  billingPeriod: string;
  maxRestaurants: number;
  maxProducts: number;
  maxOrders: number;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Modal states
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | undefined>();
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any | undefined>();
  const [planFeaturesModalOpen, setPlanFeaturesModalOpen] = useState(false);
  const [selectedPlanForFeatures, setSelectedPlanForFeatures] = useState<SubscriptionPlan | undefined>();

  // Verificar autenticação admin
  const { data: adminUser, isLoading: adminLoading } = useQuery<AdminUser>({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  // Se não está autenticado, redirecionar para login
  useEffect(() => {
    if (!adminLoading && !adminUser) {
      setLocation("/desenvolvedor");
    }
  }, [adminUser, adminLoading, setLocation]);

  // Dashboard stats
  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!adminUser,
  });

  // Listar restaurantes
  const { data: restaurantsData } = useQuery<{restaurants: Restaurant[], pagination: any}>({
    queryKey: ["/api/admin/restaurants", searchTerm],
    queryFn: () => apiRequest("GET", `/api/admin/restaurants?search=${searchTerm}&limit=50`),
    enabled: !!adminUser,
  });

  // Listar usuários
  const { data: usersData } = useQuery<{users: User[], pagination: any}>({
    queryKey: ["/api/admin/users", userSearchTerm],
    queryFn: () => apiRequest("GET", `/api/admin/users?search=${userSearchTerm}&limit=50`),
    enabled: !!adminUser,
  });

  // Listar planos
  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/plans"],
    enabled: !!adminUser,
  });

  // Listar funcionalidades
  const { data: features } = useQuery<any[]>({
    queryKey: ["/api/admin/features"],
    enabled: !!adminUser,
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/logout", {}),
    onSuccess: () => {
      queryClient.clear();
      setLocation("/desenvolvedor");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Modal handlers
  const handleCreatePlan = () => {
    setSelectedPlan(undefined);
    setPlanModalOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPlanModalOpen(true);
  };

  const handleManagePlanFeatures = (plan: SubscriptionPlan) => {
    setSelectedPlanForFeatures(plan);
    setPlanFeaturesModalOpen(true);
  };

  const handleCreateFeature = () => {
    setSelectedFeature(undefined);
    setFeatureModalOpen(true);
  };

  // Delete mutations
  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => apiRequest("DELETE", `/api/admin/plans/${planId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({
        title: "Plano excluído!",
        description: "O plano foi excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeletePlan = (planId: string) => {
    if (confirm("Tem certeza que deseja excluir este plano?")) {
      deletePlanMutation.mutate(planId);
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para formatar valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para determinar status do trial
  const getTrialStatus = (isTrialActive: boolean, trialEndsAt: string | null) => {
    if (!isTrialActive) return { status: "expired", label: "Expirado", color: "destructive" };
    if (!trialEndsAt) return { status: "active", label: "Ativo", color: "default" };
    
    const endDate = new Date(trialEndsAt);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysLeft <= 0) return { status: "expired", label: "Expirado", color: "destructive" };
    if (daysLeft <= 3) return { status: "warning", label: `${daysLeft}d restantes`, color: "secondary" };
    return { status: "active", label: `${daysLeft}d restantes`, color: "default" };
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900" data-testid="admin-dashboard-title">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-slate-600">RestaurantePro</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900" data-testid="admin-user-name">
                {adminUser.fullName}
              </p>
              <p className="text-xs text-slate-600">{adminUser.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <TrendingUp className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="restaurants" data-testid="tab-restaurants">
              <Store className="h-4 w-4 mr-2" />
              Restaurantes
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="plans" data-testid="tab-plans">
              <Package className="h-4 w-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="features" data-testid="tab-features">
              <Settings className="h-4 w-4 mr-2" />
              Funcionalidades
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Restaurantes</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-restaurants">
                    {dashboardStats?.totalRestaurants || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.activeRestaurants || 0} ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-users">
                    {dashboardStats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.trialUsers || 0} em trial
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-revenue">
                    {formatCurrency(dashboardStats?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.totalOrders || 0} pedidos
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Restaurantes */}
          <TabsContent value="restaurants" className="space-y-6 mt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar restaurantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search-restaurants"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Restaurantes Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Dono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status Trial</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurantsData?.restaurants?.map((item: Restaurant) => {
                      const trialStatus = getTrialStatus(item.owner.isTrialActive, item.owner.trialEndsAt);
                      return (
                        <TableRow key={item.restaurant.id} data-testid={`row-restaurant-${item.restaurant.id}`}>
                          <TableCell className="font-medium">
                            {item.restaurant.name}
                          </TableCell>
                          <TableCell>
                            {item.owner.firstName} {item.owner.lastName}
                          </TableCell>
                          <TableCell>{item.owner.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.owner.subscriptionPlan || "trial"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={trialStatus.color as any}>
                              {trialStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(item.restaurant.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.restaurant.isActive ? "default" : "secondary"}>
                              {item.restaurant.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar usuários..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status Trial</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users?.map((user: User) => {
                      const trialStatus = getTrialStatus(user.isTrialActive, user.trialEndsAt);
                      return (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.role === "restaurant_owner" ? "Restaurante" : "Cliente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.subscriptionPlan || "trial"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={trialStatus.color as any}>
                              {trialStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(user.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planos */}
          <TabsContent value="plans" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Planos de Assinatura</h2>
              <Button onClick={handleCreatePlan} data-testid="button-create-plan">
                <Plus className="h-4 w-4 mr-2" />
                Criar Plano
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans?.map((plan) => (
                <Card key={plan.id} data-testid={`card-plan-${plan.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(Number(plan.price))}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.billingPeriod === "monthly" ? "mês" : "ano"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p>• {plan.maxRestaurants} restaurante(s)</p>
                      <p>• {plan.maxProducts} produtos</p>
                      <p>• {plan.maxOrders} pedidos/mês</p>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditPlan(plan)}
                        data-testid={`button-edit-plan-${plan.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleManagePlanFeatures(plan)}
                        data-testid={`button-features-plan-${plan.id}`}
                      >
                        <Cog className="h-3 w-3 mr-1" />
                        Funcionalidades
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeletePlan(plan.id)}
                        disabled={deletePlanMutation.isPending}
                        data-testid={`button-delete-plan-${plan.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Funcionalidades */}
          <TabsContent value="features" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Funcionalidades do Sistema</h2>
              <Button onClick={handleCreateFeature} data-testid="button-create-feature">
                <Plus className="h-4 w-4 mr-2" />
                Nova Funcionalidade
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {features?.map((feature: any) => (
                      <TableRow key={feature.id} data-testid={`row-feature-${feature.id}`}>
                        <TableCell className="font-medium">
                          {feature.name}
                        </TableCell>
                        <TableCell>{feature.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {feature.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={feature.isActive ? "default" : "secondary"}>
                            {feature.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" data-testid={`button-edit-feature-${feature.id}`}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-delete-feature-${feature.id}`}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <PlanModal
        plan={selectedPlan}
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
      />

      <FeatureModal
        feature={selectedFeature}
        isOpen={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
      />

      {selectedPlanForFeatures && (
        <PlanFeaturesModal
          plan={selectedPlanForFeatures}
          isOpen={planFeaturesModalOpen}
          onClose={() => setPlanFeaturesModalOpen(false)}
        />
      )}
    </div>
  );
}