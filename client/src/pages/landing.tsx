import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { RestaurantCard } from "@/components/restaurant-card";
import { Search, Pizza, Sandwich, Fish, IceCream, Coffee, Leaf } from "lucide-react";

const categories = [
  { icon: Pizza, name: "Pizza", value: "pizza" },
  { icon: Sandwich, name: "Hambúrguer", value: "hamburger" },
  { icon: Fish, name: "Japonesa", value: "japanese" },
  { icon: IceCream, name: "Sobremesa", value: "dessert" },
  { icon: Coffee, name: "Bebidas", value: "drinks" },
  { icon: Leaf, name: "Saudável", value: "healthy" },
];

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: restaurants = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/restaurants", { search: searchQuery, category: selectedCategory }],
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the query key dependency
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-home">
                Para Você
              </Link>
              <Link href="/sales" className="text-primary font-medium" data-testid="link-restaurant-sales">
                Traga seu Restaurante
              </Link>
            </nav>
            <div className="flex items-center space-x-4 ml-auto">
              <Link href="/register">
                <Button 
                  variant="outline"
                  className="text-muted-foreground hover:text-foreground border-muted-foreground"
                  data-testid="button-register"
                >
                  Cadastrar
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-login"
                >
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <Logo 
                  className="h-20 w-auto mx-auto lg:mx-0" 
                  showText={false}
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-lg" data-testid="hero-title">
                Sua comida favorita, 
                <span className="block text-white">sempre perto de você</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white leading-relaxed drop-shadow-md" data-testid="hero-subtitle">
                Descubra sabores incríveis com delivery rápido e seguro. 
                Conectamos você aos melhores restaurantes da sua região.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/30">
                  <Input
                    type="text"
                    placeholder="Digite seu endereço ou CEP"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-white/90 rounded-l-xl focus:ring-0 text-lg"
                    data-testid="input-address-search"
                  />
                  <Button 
                    onClick={handleSearch}
                    className="bg-white text-orange-500 rounded-r-xl hover:bg-white/90 px-6"
                    data-testid="button-search"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Entrega rápida</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Pagamento seguro</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Suporte 24h</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                      <Pizza className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">+500 Restaurantes</h3>
                    <p className="text-white/90 text-sm">Variedade incrível de opções para todos os gostos</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                      <Coffee className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">Delivery 30min</h3>
                    <p className="text-white/90 text-sm">Entrega rápida garantida na sua porta</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                      <Leaf className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">Alimentação Saudável</h3>
                    <p className="text-white/90 text-sm">Opções nutritivas e deliciosas</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                      <IceCream className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">Sobremesas Especiais</h3>
                    <p className="text-white/90 text-sm">Finalize com chave de ouro</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Categories */}
      <section className="py-20 bg-gradient-to-br from-gray-50/50 to-orange-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="categories-title">
              Explore por Categoria
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Encontre exatamente o que você está procurando em nossa seleção de restaurantes especializados
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map(({ icon: Icon, name, value }) => (
              <button
                key={value}
                onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
                className={`text-center group cursor-pointer p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                  selectedCategory === value 
                    ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-xl" 
                    : "bg-white hover:bg-orange-50 shadow-lg hover:shadow-xl"
                }`}
                data-testid={`category-${value}`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                  selectedCategory === value 
                    ? "bg-white/20 backdrop-blur-sm" 
                    : "bg-gradient-to-br from-orange-100 to-orange-200 group-hover:from-orange-200 group-hover:to-orange-300"
                }`}>
                  <Icon className={`h-8 w-8 transition-colors duration-300 ${
                    selectedCategory === value ? "text-white" : "text-orange-600"
                  }`} />
                </div>
                <span className={`text-sm font-semibold transition-colors duration-300 ${
                  selectedCategory === value ? "text-white" : "text-gray-900"
                }`}>
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="restaurants-title">
              {selectedCategory ? `Restaurantes de ${categories.find(c => c.value === selectedCategory)?.name}` : "Restaurantes em Destaque"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {selectedCategory 
                ? `Descubra os melhores restaurantes de ${categories.find(c => c.value === selectedCategory)?.name.toLowerCase()} da sua região`
                : "Seleção especial dos restaurantes mais queridos pelos nossos clientes"
              }
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-muted"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg" data-testid="no-restaurants-message">
                {searchQuery || selectedCategory 
                  ? "Nenhum restaurante encontrado para sua busca."
                  : "Nenhum restaurante disponível no momento."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant: any) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Por que escolher o GoFood?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Somos mais que um app de delivery. Somos sua ponte para experiências gastronômicas incríveis.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Search className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Busca Inteligente</h3>
              <p className="text-gray-600">Encontre exatamente o que você quer com nossa busca avançada e filtros personalizados.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Pizza className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Qualidade Garantida</h3>
              <p className="text-gray-600">Parceiros selecionados com rigorosos padrões de qualidade e higiene.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Coffee className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Entrega Expressa</h3>
              <p className="text-gray-600">Rastreamento em tempo real e entrega no horário prometido, sempre.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Leaf className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sustentabilidade</h3>
              <p className="text-gray-600">Comprometidos com práticas sustentáveis e apoio à economia local.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section for Restaurants */}
      <section className="py-20 bg-gradient-to-br from-orange-600 via-orange-500 to-red-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="cta-title">
                Transforme seu restaurante
              </h2>
              <p className="text-xl mb-8 text-white/90 leading-relaxed" data-testid="cta-subtitle">
                Junte-se a centenas de restaurantes que já multiplicaram suas vendas com o GoFood. 
                Nossa plataforma oferece tudo que você precisa para crescer.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-900 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Gestão Completa</h4>
                    <p className="text-white/80 text-sm">Dashboard intuitivo para controlar pedidos, estoque e vendas</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-900 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Marketing Digital</h4>
                    <p className="text-white/80 text-sm">Exposição para milhares de clientes em potencial</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-900 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Suporte Dedicado</h4>
                    <p className="text-white/80 text-sm">Time especializado para ajudar seu negócio crescer</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-900 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Análise de Dados</h4>
                    <p className="text-white/80 text-sm">Relatórios detalhados para otimizar suas operações</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sales">
                  <Button 
                    size="lg" 
                    className="bg-white text-orange-600 px-8 py-4 font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                    data-testid="button-bring-restaurant"
                  >
                    Cadastrar Restaurante
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  size="lg" 
                  className="border-white/30 text-white px-8 py-4 font-semibold text-lg hover:bg-white/10 transition-colors"
                  data-testid="button-learn-more"
                >
                  Saiba Mais
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6 text-white">Vantagens Exclusivas</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-green-300 text-xl font-bold">📈</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Crescimento Garantido</h4>
                      <p className="text-white/90 text-sm">Alcance mais clientes com nossa plataforma otimizada</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-300 text-xl font-bold">⚡</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Setup Rápido</h4>
                      <p className="text-white/90 text-sm">Comece a vender em menos de 24 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-300 text-xl font-bold">🎯</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Suporte Completo</h4>
                      <p className="text-white/90 text-sm">Time dedicado para seu sucesso</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
