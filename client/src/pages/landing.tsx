import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    queryKey: ["/api/restaurants", searchQuery, selectedCategory],
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary" data-testid="logo-text">RestaurantePro</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-home">
                Para Você
              </Link>
              <Link href="/sales" className="text-primary font-medium" data-testid="link-restaurant-sales">
                Traga seu Restaurante
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-login"
                >
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-register"
                >
                  Cadastrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
              Peça comida na sua casa
            </h1>
            <p className="text-xl mb-8 opacity-90" data-testid="hero-subtitle">
              Milhares de restaurantes na palma da sua mão
            </p>
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSearch} className="flex bg-white rounded-lg shadow-lg">
                <Input
                  type="text"
                  placeholder="Digite seu endereço"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 text-gray-800 rounded-l-lg focus:ring-0"
                  data-testid="input-address-search"
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

      {/* Restaurant Categories */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="categories-title">Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map(({ icon: Icon, name, value }) => (
              <button
                key={value}
                onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
                className={`text-center group cursor-pointer p-4 rounded-lg transition-colors ${
                  selectedCategory === value ? "bg-primary/10 text-primary" : "hover:bg-card"
                }`}
                data-testid={`category-${value}`}
              >
                <div className="w-20 h-20 bg-card rounded-full shadow-md flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-shadow">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <span className="text-sm font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8" data-testid="restaurants-title">
            {selectedCategory ? `Restaurantes de ${categories.find(c => c.value === selectedCategory)?.name}` : "Restaurantes em destaque"}
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-accent to-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="cta-title">
            Tem um restaurante?
          </h2>
          <p className="text-xl mb-8 opacity-90" data-testid="cta-subtitle">
            Cadastre seu estabelecimento e alcance milhares de clientes
          </p>
          <Link href="/sales">
            <Button 
              size="lg" 
              className="bg-white text-primary px-8 py-3 font-semibold hover:bg-gray-100 transition-colors"
              data-testid="button-bring-restaurant"
            >
              Traga seu Restaurante
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
