import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, BarChart3, Utensils, Receipt, MessageSquare, Settings, Printer } from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Básico",
    price: 97,
    period: "/mês",
    features: [
      "Dashboard básico",
      "Até 100 produtos",
      "Gestão de pedidos",
      "Suporte por email",
    ],
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_BASIC,
    popular: false,
  },
  {
    id: "pro",
    name: "Profissional",
    price: 197,
    period: "/mês",
    features: [
      "Dashboard completo",
      "Produtos ilimitados",
      "Integração WhatsApp",
      "Analytics avançado",
      "Suporte prioritário",
    ],
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_PRO,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 397,
    period: "/mês",
    features: [
      "Múltiplos restaurantes",
      "API personalizada",
      "Relatórios avançados",
      "Suporte 24/7",
    ],
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_ENTERPRISE,
    popular: false,
  },
];

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
                variant="ghost"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                Já tenho conta
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
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="pricing-title">Escolha seu plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg p-6 border-2 transition-all ${
                  plan.popular
                    ? "bg-primary text-primary-foreground border-primary scale-105 shadow-lg"
                    : "bg-card border-border shadow-md hover:shadow-lg"
                }`}
                data-testid={`plan-${plan.id}`}
              >
                <div className="text-center mb-6">
                  {plan.popular && (
                    <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium mb-2 inline-block">
                      Mais Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-2">R$ {plan.price}</div>
                  <div className={plan.popular ? "opacity-80" : "text-muted-foreground"}>
                    {plan.period}
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className={`mr-3 h-4 w-4 ${plan.popular ? "text-white" : "text-green-500"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => {
                    // Save selected plan to localStorage
                    localStorage.setItem('selectedPlan', JSON.stringify({
                      id: plan.id,
                      name: plan.name,
                      price: plan.price,
                      priceId: plan.priceId
                    }));
                    // Redirect to login
                    window.location.href = "/api/login";
                  }}
                  className={`w-full py-3 font-semibold transition-colors ${
                    plan.popular
                      ? "bg-white text-primary hover:bg-gray-100"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  data-testid={`button-select-${plan.id}`}
                >
                  Começar agora
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
