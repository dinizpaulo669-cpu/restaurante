import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.string().default("0").refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Ordem deve ser um número válido"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  restaurantId: string;
  category?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({ restaurantId, category, onSuccess, onCancel }: CategoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      isActive: category?.isActive ?? true,
      sortOrder: category?.sortOrder?.toString() || "0",
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        sortOrder: parseInt(data.sortOrder),
      };

      if (isEditing) {
        const response = await fetch(`/api/categories/${category.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao atualizar categoria');
        }
        return response.json();
      } else {
        const response = await fetch("/api/dev/categories", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao criar categoria');
        }
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Categoria atualizada" : "Categoria criada",
        description: `Categoria foi ${isEditing ? "atualizada" : "adicionada"} com sucesso!`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/categories`] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Erro ao atualizar categoria" : "Erro ao criar categoria",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    categoryMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Categoria" : "Nova Categoria"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Hambúrgueres"
                      data-testid="input-category-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição opcional da categoria..."
                      className="min-h-[60px]"
                      data-testid="input-category-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ordem */}
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Exibição</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      data-testid="input-category-sort-order"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Ativo/Inativo */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Categoria Ativa</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Quando desativada, a categoria não aparecerá para os clientes
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-category-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end space-x-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  data-testid="button-cancel-category"
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={categoryMutation.isPending}
                data-testid="button-save-category"
              >
                {categoryMutation.isPending ? "Salvando..." : (isEditing ? "Atualizar" : "Salvar Categoria")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}