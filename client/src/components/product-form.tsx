import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.string().min(1, "Valor de venda é obrigatório").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser maior que zero"),
  costPrice: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), "Valor de custo deve ser um número válido"),
  stock: z.string().default("0").refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Estoque deve ser um número válido"),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  availabilityType: z.enum(["local_only", "local_and_delivery"]).default("local_and_delivery"),
  preparationTime: z.string().default("15").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Tempo de preparo deve ser maior que zero"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  restaurantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ restaurantId, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      costPrice: "",
      stock: "0",
      categoryId: "",
      isActive: true,
      availabilityType: "local_and_delivery",
      preparationTime: "15",
    },
  });

  // Buscar categorias do restaurante
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
    enabled: !!restaurantId,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const formData = new FormData();
      
      // Adicionar dados do produto
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      formData.append("price", data.price);
      if (data.costPrice) formData.append("costPrice", data.costPrice);
      formData.append("stock", data.stock);
      if (data.categoryId) formData.append("categoryId", data.categoryId);
      formData.append("isActive", String(data.isActive));
      formData.append("availabilityType", data.availabilityType);
      formData.append("preparationTime", data.preparationTime);
      
      // Adicionar imagem se selecionada
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar produto');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produto criado",
        description: "Produto foi adicionado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/products`] });
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Adicionar Novo Produto</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Upload de Imagem */}
            <div className="space-y-2">
              <FormLabel>Foto do Produto</FormLabel>
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg border"
                      data-testid="img-preview"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                      onClick={removeImage}
                      data-testid="button-remove-image"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                    data-testid="input-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    data-testid="button-upload-image"
                  >
                    {imagePreview ? "Trocar Foto" : "Carregar Foto"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Nome do Produto */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Hambúrguer Artesanal"
                      data-testid="input-name"
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
                      placeholder="Descreva os ingredientes e características do produto..."
                      className="min-h-[80px]"
                      data-testid="input-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoria */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(categories as any[]).map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        data-testid="input-cost-price"
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
                        data-testid="input-price"
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
                        data-testid="input-stock"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Disponibilidade */}
            <FormField
              control={form.control}
              name="availabilityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Onde será consumido?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-availability">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="local_only">Somente no local</SelectItem>
                      <SelectItem value="local_and_delivery">No local e delivery</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tempo de Preparo */}
            <FormField
              control={form.control}
              name="preparationTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo de Preparo (minutos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="15"
                      data-testid="input-preparation-time"
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Produto Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Quando desativado, o produto não aparecerá para os clientes
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-active"
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
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={createProductMutation.isPending}
                data-testid="button-save"
              >
                {createProductMutation.isPending ? "Salvando..." : "Salvar Produto"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}