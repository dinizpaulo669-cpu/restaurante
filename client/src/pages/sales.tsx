import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, BarChart3, Utensils, Receipt, MessageSquare, Settings, Printer, Crown, Zap, Sparkles } from "lucide-react";

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

interface PlanFeature {
  planFeature: {
    id: string;
    planId: string;
    featureId: string;
    isIncluded: boolean;
  };
  feature: {
    id: string;
    name: string;
    description: string;
    featureKey: string;
    category: string;
    isActive: boolean;
  };
}

const features = [
  {
    icon: BarChart3,
    title: "Dashboard Analytics",
    description: "Acompanhe vendas, pedidos e performance em tempo real",
  },
  {
    icon: Utensils,
    title: "Gestão de Cardápio",
    description: "Adicione produtos, categorias e variações facilmente",
  },
  {
    icon: Receipt,
    title: "Controle de Pedidos",
    description: "Gerencie comandas e atualize status de entrega",
  },
  {
    icon: MessageSquare,
    title: "Integração WhatsApp",
    description: "Receba pedidos direto no WhatsApp do seu restaurante",
  },
  {
    icon: Settings,
    title: "Configurações",
    description: "Personalize horários, dados da empresa e muito mais",
  },
  {
    icon: Printer,
    title: "Impressão",
    description: "Imprima pedidos e comandas automaticamente",
  },
];

export default function Sales() {
  // Buscar planos reais do banco de dados
  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/plans"],
    retry: false,
  });

  // Função para formatar preço
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price));
  };

  // Função para determinar se o plano é popular (Pro é o mais popular)
  const isPlanPopular = (planName: string) => {
    return planName.toLowerCase() === "pro";
  };

  // Função para determinar o ícone do plano
  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase() === "enterprise") return Crown;
    if (planName.toLowerCase() === "pro") return Zap;
    return Sparkles;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">RestaurantePro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/login"}
                data-testid="button-header-login"
                className="bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="hero-title">
                Transforme seu restaurante
              </h1>
              <p className="text-xl mb-8 opacity-90" data-testid="hero-description">
                Sistema completo para gerenciar pedidos, cardápio, entregas e muito mais. Alcance novos clientes e aumente suas vendas.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-5 w-5" />
                  <span>Dashboard completo com analytics</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-5 w-5" />
                  <span>Gerenciamento de cardápio</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-5 w-5" />
                  <span>Controle de pedidos em tempo real</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-5 w-5" />
                  <span>Integração com WhatsApp</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <img 
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
                alt="Cozinha moderna de restaurante com chefs preparando comida" 
                className="rounded-lg shadow-2xl w-full max-w-md mx-auto"
                data-testid="img-kitchen"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="features-title">Tudo que você precisa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description }, index) => (
              <div key={index} className="text-center" data-testid={`feature-${index}`}>
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="pricing-title">Escolha seu plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans?.filter(plan => plan.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => {
              const popular = isPlanPopular(plan.name);
              const PlanIcon = getPlanIcon(plan.name);
              
              return (
                <div
                  key={plan.id}
                  className={`rounded-lg p-6 border-2 transition-all relative ${
                    popular
                      ? "bg-primary text-primary-foreground border-primary scale-105 shadow-lg"
                      : "bg-card border-border shadow-md hover:shadow-lg"
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                        Mais Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        popular ? "bg-white/20" : "bg-primary/10"
                      }`}>
                        <PlanIcon className={`h-6 w-6 ${popular ? "text-white" : "text-primary"}`} />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className={`text-sm mb-4 ${popular ? "text-white/80" : "text-muted-foreground"}`}>
                      {plan.description}
                    </p>
                    <div className="text-4xl font-bold mb-2">{formatPrice(plan.price)}</div>
                    <div className={popular ? "opacity-80" : "text-muted-foreground"}>
                      /{plan.billingPeriod === "monthly" ? "mês" : "ano"}
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircle className={`mr-3 h-4 w-4 ${popular ? "text-white" : "text-green-500"}`} />
                      <span>{plan.maxRestaurants === 1 ? "1 restaurante" : `${plan.maxRestaurants} restaurantes`}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className={`mr-3 h-4 w-4 ${popular ? "text-white" : "text-green-500"}`} />
                      <span>Até {plan.maxProducts} produtos</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className={`mr-3 h-4 w-4 ${popular ? "text-white" : "text-green-500"}`} />
                      <span>{plan.maxOrders} pedidos/mês</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className={`mr-3 h-4 w-4 ${popular ? "text-white" : "text-green-500"}`} />
                      <span>Dashboard completo</span>
                    </li>
                    {plan.name.toLowerCase() !== "trial" && (
                      <>
                        <li className="flex items-center">
                          <CheckCircle className={`mr-3 h-4 w-4 ${popular ? "text-white" : "text-green-500"}`} />
                          <span>Relatórios de lucro</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className={`mr-3 h-4 w-4 ${popular ? "text-white" : "text-green-500"}`} />
                          <span>Integração WhatsApp</span>
                        </li>
                      </>
                    )}
                    {plan.name.toLowerCase() === "enterprise" && (
                      <>
                        <li className="flex items-center">
                          <CheckCircle className={`mr-3 h-4 w-4 ${popular ? "text-white" : "text-green-500"}`} />
                          <span>API personalizada</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className={`mr-3 h-4 w-4 ${popular ? "text-white" : "text-green-500"}`} />
                          <span>Suporte prioritário</span>
                        </li>
                      </>
                    )}
                  </ul>
                  
                  <Button
                    onClick={() => {
                      // Save selected plan to localStorage
                      localStorage.setItem('selectedPlan', plan.name);
                      // Set user type as restaurant owner since they're selecting a restaurant plan
                      localStorage.setItem('selectedUserType', 'restaurant_owner');
                      // Redirect to restaurant setup
                      window.location.href = "/setup-restaurant";
                    }}
                    className={`w-full py-3 font-semibold transition-colors ${
                      popular
                        ? "bg-white text-primary hover:bg-gray-100"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                    data-testid={`button-select-${plan.id}`}
                  >
                    {plan.name.toLowerCase() === "trial" ? "Teste Grátis" : "Começar Agora"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
