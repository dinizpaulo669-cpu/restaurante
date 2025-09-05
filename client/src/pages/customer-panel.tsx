import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RestaurantCard } from "@/components/restaurant-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Search, 
  Pizza, 
  Sandwich, 
  Fish, 
  IceCream, 
  Coffee, 
  Leaf, 
  User, 
  MapPin, 
  Heart, 
  ShoppingBag, 
  Home, 
  Bell,
  Star,
  Clock,
  Truck,
  Menu
} from "lucide-react";

const categories = [
  { icon: Pizza, name: "Pizza", value: "pizza", color: "bg-red-100 text-red-600" },
  { icon: Sandwich, name: "Hambúrguer", value: "hamburger", color: "bg-orange-100 text-orange-600" },
  { icon: Fish, name: "Japonesa", value: "japanese", color: "bg-pink-100 text-pink-600" },
  { icon: IceCream, name: "Sobremesa", value: "dessert", color: "bg-purple-100 text-purple-600" },
  { icon: Coffee, name: "Bebidas", value: "drinks", color: "bg-amber-100 text-amber-600" },
  { icon: Leaf, name: "Saudável", value: "healthy", color: "bg-green-100 text-green-600" },
];

const bottomNavItems = [
  { icon: Home, label: "Início", value: "home" },
  { icon: Search, label: "Buscar", value: "search" },
  { icon: ShoppingBag, label: "Pedidos", value: "orders" },
  { icon: Heart, label: "Favoritos", value: "favorites" },
  { icon: User, label: "Perfil", value: "profile" },
];

export default function CustomerPanel() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      setLocation("/");
      return;
    }
    setUser(JSON.parse(currentUser));
  }, [setLocation]);

  const { data: restaurants = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/restaurants", searchQuery, selectedCategory],
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderHomeContent = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-4 sm:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" data-testid="welcome-title">
          Olá, {user.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-white/90 mb-4 text-sm sm:text-base" data-testid="welcome-subtitle">
          O que você gostaria de comer hoje?
        </p>
        <div className="flex bg-white rounded-lg p-1">
          <Input
            type="text"
            placeholder="Buscar restaurantes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 text-gray-800 focus:ring-0"
            data-testid="input-search"
          />
          <Button 
            onClick={() => setActiveTab("search")}
            className="bg-primary text-white hover:bg-primary/90"
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4" data-testid="categories-title">Categorias</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
          {categories.map(({ icon: Icon, name, value, color }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
              className={`p-3 sm:p-4 rounded-xl text-center transition-all hover:scale-105 ${
                selectedCategory === value ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border"
              }`}
              data-testid={`category-${value}`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <span className="text-xs sm:text-sm font-medium">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="text-center p-3 sm:p-4">
          <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold">12</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Pedidos</div>
        </Card>
        <Card className="text-center p-3 sm:p-4">
          <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold">5</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Favoritos</div>
        </Card>
        <Card className="text-center p-3 sm:p-4">
          <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold">★ 4.8</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Avaliação</div>
        </Card>
        {!isMobile && (
          <Card className="text-center p-3 sm:p-4">
            <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold">R$ 245</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Economizado</div>
          </Card>
        )}
      </div>

      {/* Featured Restaurants */}
      <div>
        <h2 className="text-xl font-bold mb-4" data-testid="restaurants-title">Restaurantes em destaque</h2>
        {isLoading ? (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {[...Array(isMobile ? 3 : 6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {restaurants.slice(0, isMobile ? 3 : 6).map((restaurant: any) => (
              <Card key={restaurant.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Pizza className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base lg:text-lg">{restaurant.name}</h3>
                    <p className="text-muted-foreground text-sm mb-1">{restaurant.category}</p>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        4.5
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        25-35 min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Truck className="w-3 h-3 mr-1" />
                        R$ 5,99
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSearchContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Buscar Restaurantes</h2>
        <form onSubmit={handleSearch} className="flex bg-card rounded-lg border">
          <Input
            type="text"
            placeholder="Digite o nome do restaurante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 focus:ring-0"
            data-testid="input-search-page"
          />
          <Button type="submit" className="m-1">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* All Restaurants */}
      {isLoading ? (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {[...Array(isMobile ? 6 : 12)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground" data-testid="no-restaurants-message">
            {searchQuery 
              ? "Nenhum restaurante encontrado para sua busca."
              : "Digite algo para buscar restaurantes."}
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {restaurants.map((restaurant: any) => (
            <div key={restaurant.id} className="lg:col-span-1">
              <RestaurantCard restaurant={restaurant} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrdersContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Meus Pedidos</h2>
      <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
        {/* Placeholder for orders */}
        <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">Pizzaria Bella</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">Pizza Margherita + Coca-Cola</p>
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs ml-2 flex-shrink-0">Entregue</Badge>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-muted-foreground">15 Jan, 2025</span>
            <span className="font-semibold text-primary">R$ 45,90</span>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">Burger House</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">Burger Clássico + Batata</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 text-xs ml-2 flex-shrink-0">A caminho</Badge>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Hoje, 14:30</span>
            <span className="font-semibold text-primary">R$ 32,50</span>
          </div>
        </Card>
        
        {!isMobile && (
          <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">Sushi Master</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">Combo Sashimi + Temaki</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-2 flex-shrink-0">Preparando</Badge>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground">Ontem, 19:45</span>
              <span className="font-semibold text-primary">R$ 67,50</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const renderFavoritesContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Meus Favoritos</h2>
      <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Placeholder for favorites */}
        <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
          <div className="flex space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Pizza className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">Pizzaria Bella</h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Pizza • Italiana</p>
              <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">★ 4.7</Badge>
                <Badge variant="outline" className="text-xs hidden sm:inline-flex">30-40 min</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <Heart className="h-4 w-4 text-red-500 fill-current" />
            </Button>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
          <div className="flex space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sandwich className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">Burger House</h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Hambúrguer • Americana</p>
              <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">★ 4.5</Badge>
                <Badge variant="outline" className="text-xs hidden sm:inline-flex">20-30 min</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <Heart className="h-4 w-4 text-red-500 fill-current" />
            </Button>
          </div>
        </Card>
        
        {!isMobile && (
          <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="flex space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">Vida Verde</h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Saudável • Vegana</p>
                <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">★ 4.9</Badge>
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">15-25 min</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <Heart className="h-4 w-4 text-red-500 fill-current" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const renderProfileContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Meu Perfil</h2>
      
      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* User Info */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg sm:text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold truncate" data-testid="profile-name">{user.name}</h3>
              <p className="text-sm sm:text-base text-muted-foreground truncate" data-testid="profile-email">{user.email}</p>
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground" data-testid="profile-address">{user.address}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs sm:text-sm font-medium">Telefone:</span>
              <span className="text-xs sm:text-sm" data-testid="profile-phone">{user.phone}</span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-2 sm:space-y-3">
          <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
            <User className="h-4 w-4 mr-2 sm:mr-3" />
            Editar Perfil
          </Button>
          <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
            <MapPin className="h-4 w-4 mr-2 sm:mr-3" />
            Gerenciar Endereços
          </Button>
          <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
            <Bell className="h-4 w-4 mr-2 sm:mr-3" />
            Notificações
          </Button>
          {!isMobile && (
            <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
              <Heart className="h-4 w-4 mr-2 sm:mr-3" />
              Configurações de Privacidade
            </Button>
          )}
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600 hover:bg-red-50 text-sm sm:text-base" 
            onClick={() => {
              localStorage.removeItem('currentUser');
              setLocation("/");
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "home": return renderHomeContent();
      case "search": return renderSearchContent();
      case "orders": return renderOrdersContent();
      case "favorites": return renderFavoritesContent();
      case "profile": return renderProfileContent();
      default: return renderHomeContent();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-card border-r border-border flex-shrink-0">
          <div className="p-6">
            <h1 className="text-xl font-bold text-primary" data-testid="logo-text-desktop">
              RestaurantePro
            </h1>
          </div>
          <nav className="mt-6">
            {bottomNavItems.map(({ icon: Icon, label, value }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  activeTab === value 
                    ? "text-primary bg-primary/10 border-r-2 border-primary" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
                data-testid={`nav-desktop-${value}`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
          <div className={`mx-auto px-4 lg:px-6 xl:px-8 ${isMobile ? 'max-w-md' : 'max-w-none'}`}>
            <div className="flex justify-between items-center h-16">
              {isMobile && (
                <h1 className="text-xl font-bold text-primary" data-testid="logo-text">
                  RestaurantePro
                </h1>
              )}
              {!isMobile && (
                <h2 className="text-xl font-semibold">
                  {bottomNavItems.find(item => item.value === activeTab)?.label || "Início"}
                </h2>
              )}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                </Button>
                {!isMobile && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 px-4 lg:px-6 xl:px-8 py-6 ${isMobile ? 'max-w-md mx-auto pb-20' : 'max-w-7xl mx-auto'}`}>
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
            <div className="max-w-md mx-auto">
              <div className="flex">
                {bottomNavItems.map(({ icon: Icon, label, value }) => (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`flex-1 py-3 px-2 text-center transition-colors ${
                      activeTab === value 
                        ? "text-primary bg-primary/5" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`nav-${value}`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}