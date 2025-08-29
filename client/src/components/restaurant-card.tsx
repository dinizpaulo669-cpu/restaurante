import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { Restaurant } from "@shared/schema";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const deliveryTime = `${restaurant.minDeliveryTime}-${restaurant.maxDeliveryTime} min`;
  const deliveryInfo = restaurant.deliveryFee === "0.00" ? "Entrega grátis" : `Taxa R$ ${restaurant.deliveryFee}`;
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      data-testid={`restaurant-card-${restaurant.id}`}
    >
      <div className="relative">
        {restaurant.bannerUrl ? (
          <img 
            src={restaurant.bannerUrl} 
            alt={restaurant.name}
            className="w-full h-48 object-cover"
            data-testid={`img-restaurant-${restaurant.id}`}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary" data-testid={`placeholder-${restaurant.id}`}>
              {restaurant.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg" data-testid={`name-${restaurant.id}`}>
            {restaurant.name}
          </h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm ml-1" data-testid={`rating-${restaurant.id}`}>
              {restaurant.rating}
            </span>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-2" data-testid={`category-time-${restaurant.id}`}>
          {restaurant.category} • {deliveryTime}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground" data-testid={`delivery-info-${restaurant.id}`}>
            {deliveryInfo}
          </span>
          <Badge variant="outline" className="text-primary" data-testid={`min-order-${restaurant.id}`}>
            Pedido mínimo: R$ 15
          </Badge>
        </div>

        {restaurant.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2" data-testid={`description-${restaurant.id}`}>
            {restaurant.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
