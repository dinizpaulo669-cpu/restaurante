import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Trash2 } from "lucide-react";

interface AdditionalListProps {
  restaurantId: string;
  onEdit?: (additional: any) => void;
}

export function AdditionalList({ restaurantId, onEdit }: AdditionalListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: additionals = [], isLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/additionals`],
    enabled: !!restaurantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (additionalId: string) => {
      const response = await fetch(`/api/additionals/${additionalId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao remover adicional');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Adicional removido",
        description: "Adicional foi removido com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/additionals`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover adicional",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (additional: any) => {
    if (confirm(`Tem certeza que deseja remover o adicional "${additional.name}"?`)) {
      deleteMutation.mutate(additional.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (additionals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Nenhum adicional cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {(additionals as any[]).map((additional: any) => (
        <Card key={additional.id} data-testid={`additional-card-${additional.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium" data-testid={`additional-name-${additional.id}`}>
                    {additional.name}
                  </h4>
                  <Badge 
                    variant={additional.isActive ? "default" : "secondary"}
                    className={additional.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    data-testid={`additional-status-${additional.id}`}
                  >
                    {additional.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {additional.description && (
                  <p className="text-sm text-muted-foreground mt-1" data-testid={`additional-description-${additional.id}`}>
                    {additional.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  {additional.costPrice && (
                    <span className="text-muted-foreground">
                      Custo: R$ {additional.costPrice}
                    </span>
                  )}
                  <span className="text-primary font-semibold" data-testid={`additional-price-${additional.id}`}>
                    Venda: R$ {additional.price}
                  </span>
                  <span className="text-muted-foreground">
                    Estoque: {additional.stock || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit?.(additional)}
                  data-testid={`button-edit-additional-${additional.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive" 
                  onClick={() => handleDelete(additional)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-additional-${additional.id}`}
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