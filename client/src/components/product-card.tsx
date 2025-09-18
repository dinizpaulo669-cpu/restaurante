import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card data-testid={`product-card-${product.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg"
                data-testid={`img-product-${product.id}`}
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-2xl" data-testid={`placeholder-product-${product.id}`}>
                  {product.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h4 className="font-medium" data-testid={`product-name-${product.id}`}>
                {product.name}
              </h4>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`product-description-${product.id}`}>
                  {product.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-primary font-semibold" data-testid={`product-price-${product.id}`}>
                  R$ {product.price}
                </span>
                <Badge 
                  variant={product.isActive ? "default" : "secondary"}
                  className={product.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  data-testid={`product-status-${product.id}`}
                >
                  {product.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit?.(product)}
              data-testid={`button-edit-${product.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive" 
              onClick={() => onDelete?.(product.id)}
              data-testid={`button-delete-${product.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
