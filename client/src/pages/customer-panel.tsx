import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestaurantCard } from "@/components/restaurant-card";
import { Search, Pizza, Sandwich, Fish, IceCream, Coffee, Leaf, User, MapPin, Phone, Mail, LogOut } from "lucide-react";

const categories = [
  { icon: Pizza, name: "Pizza", value: "pizza" },
  { icon: Sandwich, name: "Hambúrguer", value: "hamburger" },
  { icon: Fish, name: "Japonesa", value: "japanese" },
  { icon: IceCream, name: "Sobremesa", value: "dessert" },
  { icon: Coffee, name: "Bebidas", value: "drinks" },
  { icon: Leaf, name: "Saudável", value: "healthy" },
];

export default function CustomerPanel() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setLocation("/");
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">RestaurantePro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium" data-testid="user-name">{user.name}</p>
                  <p className="text-xs text-muted-foreground" data-testid="user-email">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="welcome-title">
              Olá, {user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-lg mb-6 opacity-90" data-testid="welcome-subtitle">
              O que você gostaria de comer hoje?
            </p>
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSearch} className="flex bg-white rounded-lg shadow-lg">
                <Input
                  type="text"
                  placeholder="Buscar restaurantes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 text-gray-800 rounded-l-lg focus:ring-0"
                  data-testid="input-search"
                />
                <Button 
                  type="submit" 
                  className="bg-primary text-white rounded-r-lg hover:bg-primary/90"
                  data-testid="button-search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* User Info Card */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Suas Informações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="info-email">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="info-phone">{user.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="info-address">{user.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground" data-testid="info-status">
                    Cliente Ativo
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Restaurant Categories */}
      <section className="py-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8" data-testid="categories-title">Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(({ icon: Icon, name, value }) => (
              <button
                key={value}
                onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
                className={`text-center group cursor-pointer p-4 rounded-lg transition-colors ${
                  selectedCategory === value ? "bg-primary/10 text-primary" : "hover:bg-card"
                }`}
                data-testid={`category-${value}`}
              >
                <div className="w-16 h-16 bg-card rounded-full shadow-md flex items-center justify-center mx-auto mb-2 group-hover:shadow-lg transition-shadow">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6" data-testid="restaurants-title">
            {selectedCategory ? `Restaurantes de ${categories.find(c => c.value === selectedCategory)?.name}` : "Restaurantes disponíveis"}
          </h2>
          
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
    </div>
  );
}