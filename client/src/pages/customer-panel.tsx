import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RestaurantCard } from "@/components/restaurant-card";
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
  Truck
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
      <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2" data-testid="welcome-title">
          Olá, {user.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-white/90 mb-4" data-testid="welcome-subtitle">
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
        <h2 className="text-xl font-bold mb-4" data-testid="categories-title">Categorias</h2>
        <div className="grid grid-cols-3 gap-3">
          {categories.map(({ icon: Icon, name, value, color }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
              className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${
                selectedCategory === value ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border"
              }`}
              data-testid={`category-${value}`}
            >
              <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-4">
          <div className="text-primary text-2xl font-bold">12</div>
          <div className="text-sm text-muted-foreground">Pedidos</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-primary text-2xl font-bold">5</div>
          <div className="text-sm text-muted-foreground">Favoritos</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-primary text-2xl font-bold">★ 4.8</div>
          <div className="text-sm text-muted-foreground">Avaliação</div>
        </Card>
      </div>

      {/* Featured Restaurants */}
      <div>
        <h2 className="text-xl font-bold mb-4" data-testid="restaurants-title">Restaurantes em destaque</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
          <div className="space-y-4">
            {restaurants.slice(0, 3).map((restaurant: any) => (
              <Card key={restaurant.id} className="p-4">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Pizza className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                    <p className="text-muted-foreground text-sm mb-1">{restaurant.category}</p>
                    <div className="flex items-center space-x-2">
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
        <div className="grid grid-cols-1 gap-4">
          {[...Array(6)].map((_, i) => (
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
        <div className="space-y-4">
          {restaurants.map((restaurant: any) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );

  const renderOrdersContent = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Meus Pedidos</h2>
      <div className="space-y-4">
        {/* Placeholder for orders */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Pizzaria Bella</h3>
            <Badge className="bg-green-100 text-green-800">Entregue</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Pizza Margherita + Coca-Cola</p>
          <div className="flex justify-between text-sm">
            <span>15 Jan, 2025</span>
            <span className="font-semibold">R$ 45,90</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Burger House</h3>
            <Badge className="bg-blue-100 text-blue-800">A caminho</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Burger Clássico + Batata</p>
          <div className="flex justify-between text-sm">
            <span>Hoje, 14:30</span>
            <span className="font-semibold">R$ 32,50</span>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderFavoritesContent = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Meus Favoritos</h2>
      <div className="space-y-4">
        {/* Placeholder for favorites */}
        <Card className="p-4">
          <div className="flex space-x-4">
            <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
              <Pizza className="h-8 w-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Pizzaria Bella</h3>
              <p className="text-sm text-muted-foreground">Pizza • Italiana</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">★ 4.7</Badge>
                <Badge variant="outline" className="text-xs">30-40 min</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4 text-red-500 fill-current" />
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex space-x-4">
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
              <Sandwich className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Burger House</h3>
              <p className="text-sm text-muted-foreground">Hambúrguer • Americana</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">★ 4.5</Badge>
                <Badge variant="outline" className="text-xs">20-30 min</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4 text-red-500 fill-current" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderProfileContent = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Meu Perfil</h2>
      
      {/* User Info */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold" data-testid="profile-name">{user.name}</h3>
            <p className="text-muted-foreground" data-testid="profile-email">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid="profile-address">{user.address}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">Telefone:</span>
            <span className="text-sm" data-testid="profile-phone">{user.phone}</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start">
          <User className="h-4 w-4 mr-3" />
          Editar Perfil
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <MapPin className="h-4 w-4 mr-3" />
          Gerenciar Endereços
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Bell className="h-4 w-4 mr-3" />
          Notificações
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:bg-red-50" 
          onClick={() => {
            localStorage.removeItem('currentUser');
            setLocation("/");
          }}
        >
          Sair
        </Button>
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-primary" data-testid="logo-text">
              RestaurantePro
            </h1>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
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
    </div>
  );
}