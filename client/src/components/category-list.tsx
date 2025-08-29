import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Trash2 } from "lucide-react";

interface CategoryListProps {
  restaurantId: string;
  onEdit?: (category: any) => void;
}

export function CategoryList({ restaurantId, onEdit }: CategoryListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
    enabled: !!restaurantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao remover categoria');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Categoria removida",
        description: "Categoria foi removida com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/categories`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover categoria",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (category: any) => {
    if (confirm(`Tem certeza que deseja remover a categoria "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {(categories as any[]).map((category: any) => (
        <Card key={category.id} data-testid={`category-card-${category.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium" data-testid={`category-name-${category.id}`}>
                    {category.name}
                  </h4>
                  <Badge 
                    variant={category.isActive ? "default" : "secondary"}
                    className={category.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    data-testid={`category-status-${category.id}`}
                  >
                    {category.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-1" data-testid={`category-description-${category.id}`}>
                    {category.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Ordem: {category.sortOrder}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit?.(category)}
                  data-testid={`button-edit-category-${category.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive" 
                  onClick={() => handleDelete(category)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-category-${category.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}