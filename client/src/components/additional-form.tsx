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

const additionalFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  costPrice: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), "Valor de custo deve ser um número válido"),
  price: z.string().min(1, "Valor de venda é obrigatório").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser maior que zero"),
  stock: z.string().default("0").refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Estoque deve ser um número válido"),
  isActive: z.boolean().default(true),
});

type AdditionalFormData = z.infer<typeof additionalFormSchema>;

interface AdditionalFormProps {
  restaurantId: string;
  additional?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdditionalForm({ restaurantId, additional, onSuccess, onCancel }: AdditionalFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!additional;

  const form = useForm<AdditionalFormData>({
    resolver: zodResolver(additionalFormSchema),
    defaultValues: {
      name: additional?.name || "",
      description: additional?.description || "",
      costPrice: additional?.costPrice?.toString() || "",
      price: additional?.price?.toString() || "",
      stock: additional?.stock?.toString() || "0",
      isActive: additional?.isActive ?? true,
    },
  });

  const additionalMutation = useMutation({
    mutationFn: async (data: AdditionalFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        isActive: data.isActive,
      };

      if (isEditing) {
        const response = await fetch(`/api/additionals/${additional.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao atualizar adicional');
        }
        return response.json();
      } else {
        const response = await fetch("/api/additionals", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao criar adicional');
        }
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Adicional atualizado" : "Adicional criado",
        description: `Adicional foi ${isEditing ? "atualizado" : "adicionado"} com sucesso!`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/additionals`] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Erro ao atualizar adicional" : "Erro ao criar adicional",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdditionalFormData) => {
    additionalMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Adicional" : "Novo Adicional"}</CardTitle>
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
                  <FormLabel>Nome do Adicional *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Queijo Extra"
                      data-testid="input-additional-name"
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
                      placeholder="Descrição opcional do adicional..."
                      className="min-h-[60px]"
                      data-testid="input-additional-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valores e Estoque */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Custo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-additional-cost-price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Venda *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-additional-price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        data-testid="input-additional-stock"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Ativo/Inativo */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Adicional Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Quando desativado, o adicional não aparecerá para os clientes
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-additional-active"
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
                  data-testid="button-cancel-additional"
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={additionalMutation.isPending}
                data-testid="button-save-additional"
              >
                {additionalMutation.isPending ? "Salvando..." : (isEditing ? "Atualizar" : "Salvar Adicional")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}