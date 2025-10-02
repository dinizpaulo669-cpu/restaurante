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
  Cog,
  CreditCard
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
    category?: string;
    isActive: boolean;
    createdAt: string;
  };
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    subscriptionPlan?: string;
    isTrialActive: boolean;
    trialEndsAt: string | null;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  role: string;
  subscriptionPlan?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
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
  trialDays: number;
  isActive: boolean;
  sortOrder: number;
}

interface GlobalSettings {
  id: string;
  supportWhatsapp: string;
  supportEmail: string;
  createdAt: string;
  updatedAt: string;
}

// Componente de formulário de configurações
function SettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [supportWhatsapp, setSupportWhatsapp] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  // Buscar configurações atuais
  const { data: settingsData, isLoading: loadingSettings } = useQuery<{ settings: GlobalSettings }>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setSupportWhatsapp(settingsData.settings.supportWhatsapp || "");
      setSupportEmail(settingsData.settings.supportEmail || "");
    }
  }, [settingsData]);

  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { supportWhatsapp: string; supportEmail: string }) => {
      return apiRequest("PUT", "/api/admin/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações foram salvas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar as configurações",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ supportWhatsapp, supportEmail });
  };

  if (loadingSettings) {
    return <div>Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="supportWhatsapp">Número do WhatsApp de Suporte</Label>
        <Input
          id="supportWhatsapp"
          type="text"
          placeholder="Ex: 5511999999999"
          value={supportWhatsapp}
          onChange={(e) => setSupportWhatsapp(e.target.value)}
          data-testid="input-support-whatsapp"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Formato: código do país + DDD + número (apenas números)
        </p>
      </div>

      <div>
        <Label htmlFor="supportEmail">E-mail de Suporte</Label>
        <Input
          id="supportEmail"
          type="email"
          placeholder="suporte@exemplo.com"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          data-testid="input-support-email"
        />
      </div>

      <Button
        type="submit"
        disabled={updateSettingsMutation.isPending}
        data-testid="button-save-settings"
      >
        {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </form>
  );
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

  // Buscar pagamentos PIX
  const { data: paymentsData, refetch: refetchPayments } = useQuery({
    queryKey: ["/api/admin/payments"],
    enabled: !!adminUser && activeTab === "pagamentos",
  }) as { data?: { payments: any[] }, refetch: () => void };

  // Listar restaurantes
  const { data: restaurantsData } = useQuery({
    queryKey: ["/api/admin/restaurants", searchTerm],
    enabled: !!adminUser,
  }) as { data?: { restaurants: any[], pagination: any } };

  // Listar usuários
  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users", userSearchTerm],
    enabled: !!adminUser,
  }) as { data?: { users: any[], pagination: any } };

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

  // Mutation para confirmar pagamento manualmente
  const confirmPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => 
      apiRequest("POST", `/api/admin/payments/${paymentId}/confirm`, {}),
    onSuccess: () => {
      // Invalidar múltiplos caches que podem ter sido afetados pela confirmação
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      
      toast({
        title: "Pagamento confirmado",
        description: "O pagamento foi confirmado e o plano foi ativado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message || "Não foi possível confirmar o pagamento",
        variant: "destructive",
      });
    },
  });

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
                <p className="text-sm text-slate-600">GoFood</p>
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
          <TabsList className="grid w-full grid-cols-7">
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
            <TabsTrigger value="pagamentos" data-testid="tab-pagamentos">
              <CreditCard className="h-4 w-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="configuracoes" data-testid="tab-configuracoes">
              <Cog className="h-4 w-4 mr-2" />
              Configurações
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
                      <TableHead>Restaurante</TableHead>
                      <TableHead>Proprietário</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status Trial</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead>Status Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurantsData?.restaurants?.map((item: any) => {
                      const trialStatus = getTrialStatus(item.owner.isTrialActive, item.owner.trialEndsAt);
                      const createdAt = new Date(item.restaurant.createdAt);
                      const now = new Date();
                      const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Determinar status de pagamento
                      let paymentStatus = { label: "Em teste", color: "default" };
                      if (!item.owner.isTrialActive) {
                        // Se não está em trial mais, verificar se tem atraso
                        if (daysSinceCreated > 35) { // 30 dias trial + 5 dias tolerância
                          paymentStatus = { label: "Atrasado", color: "destructive" };
                        } else {
                          paymentStatus = { label: "Em dia", color: "default" };
                        }
                      }
                      
                      return (
                        <TableRow key={item.restaurant.id} data-testid={`row-restaurant-${item.restaurant.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.restaurant.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.restaurant.category || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {item.owner.firstName} {item.owner.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.owner.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Tel: {item.owner.phone || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
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
                            <div>
                              <div>{formatDate(item.restaurant.createdAt)}</div>
                              <div className="text-xs text-muted-foreground">
                                {daysSinceCreated} dia{daysSinceCreated !== 1 ? 's' : ''} atrás
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentStatus.color as any}>
                              {paymentStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.restaurant.isActive ? "default" : "secondary"}>
                              {item.restaurant.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
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
                      <TableHead>Usuário</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status Trial</TableHead>
                      <TableHead>Stripe Info</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users?.map((user: any) => {
                      const trialStatus = getTrialStatus(user.isTrialActive, user.trialEndsAt);
                      const createdAt = new Date(user.createdAt);
                      const now = new Date();
                      const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.email}</div>
                              <div className="text-sm text-muted-foreground">
                                Tel: {user.phone || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Endereço: {user.address || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === "restaurant_owner" ? "default" : "secondary"}>
                              {user.role === "restaurant_owner" ? "Dono Restaurante" : 
                               user.role === "customer" ? "Cliente" : 
                               user.role === "employee" ? "Funcionário" : user.role}
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
                            <div className="text-xs">
                              <div>
                                Customer: {user.stripeCustomerId ? 
                                  <span className="text-green-600">✓ {user.stripeCustomerId.substring(0, 12)}...</span> : 
                                  <span className="text-gray-500">N/A</span>
                                }
                              </div>
                              <div>
                                Subscription: {user.stripeSubscriptionId ? 
                                  <span className="text-green-600">✓ {user.stripeSubscriptionId.substring(0, 12)}...</span> : 
                                  <span className="text-gray-500">N/A</span>
                                }
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{formatDate(user.createdAt)}</div>
                              <div className="text-xs text-muted-foreground">
                                {daysSinceCreated} dia{daysSinceCreated !== 1 ? 's' : ''} atrás
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
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
                      <p>• {plan.trialDays} dias de teste grátis</p>
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

          {/* Pagamentos */}
          <TabsContent value="pagamentos" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gerenciamento de Pagamentos</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pagamentos PIX Pendentes e Concluídos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gerencie confirmações de pagamento e ativação de planos
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurante</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsData?.payments?.map((payment: any) => {
                      const statusColor = payment.status === 'paid' ? 'default' : 
                                         payment.status === 'pending' ? 'secondary' : 
                                         payment.status === 'expired' ? 'destructive' : 'outline';
                      const statusLabel = payment.status === 'paid' ? 'Pago' : 
                                         payment.status === 'pending' ? 'Pendente' : 
                                         payment.status === 'expired' ? 'Expirado' : 
                                         payment.status === 'cancelled' ? 'Cancelado' : payment.status;
                      
                      return (
                        <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payment.restaurant?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Proprietário: {payment.user?.firstName} {payment.user?.lastName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.plan?.name || 'N/A'}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              R$ {parseFloat(payment.plan?.price || 0).toFixed(2)}/mês
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              R$ {parseFloat(payment.amount || 0).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {payment.billingPeriodMonths} mês{payment.billingPeriodMonths > 1 ? 'es' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColor as any}>
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(payment.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(payment.createdAt).toLocaleTimeString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.paidAt ? (
                              <div>
                                <div className="text-sm">
                                  {new Date(payment.paidAt).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(payment.paidAt).toLocaleTimeString('pt-BR')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {payment.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => confirmPaymentMutation.mutate(payment.id)}
                                  disabled={confirmPaymentMutation.isPending}
                                  data-testid={`button-confirm-payment-${payment.id}`}
                                >
                                  {confirmPaymentMutation.isPending ? (
                                    <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                  {confirmPaymentMutation.isPending ? "..." : "Confirmar"}
                                </Button>
                              )}
                              <Button size="sm" variant="outline" data-testid={`button-view-payment-${payment.id}`}>
                                <Edit className="h-3 w-3" />
                                Detalhes
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!paymentsData?.payments || paymentsData.payments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6">
                          <div className="text-muted-foreground">
                            Nenhum pagamento encontrado
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="configuracoes" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Suporte</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure os canais de suporte para os clientes
                </p>
              </CardHeader>
              <CardContent>
                <SettingsForm />
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