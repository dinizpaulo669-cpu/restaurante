import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id?: string;
  name: string;
  description: string;
  price: string;
  billingPeriod: string;
  maxRestaurants: number;
  maxProducts: number;
  maxOrders: number;
  isActive: boolean;
  sortOrder: number;
}

interface PlanModalProps {
  plan?: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlanModal({ plan, isOpen, onClose }: PlanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SubscriptionPlan>({
    name: "",
    description: "",
    price: "",
    billingPeriod: "monthly",
    maxRestaurants: 1,
    maxProducts: 50,
    maxOrders: 100,
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        billingPeriod: "monthly",
        maxRestaurants: 1,
        maxProducts: 50,
        maxOrders: 100,
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [plan, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: SubscriptionPlan) => apiRequest("POST", "/api/admin/plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({
        title: "Plano criado!",
        description: "O plano foi criado com sucesso",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SubscriptionPlan) => apiRequest("PUT", `/api/admin/plans/${plan?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({
        title: "Plano atualizado!",
        description: "O plano foi atualizado com sucesso",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan?.id) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof SubscriptionPlan, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle data-testid="plan-modal-title">
            {plan ? "Editar Plano" : "Criar Plano"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex: Básico, Pro, Enterprise"
                required
                data-testid="input-plan-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="49.90"
                required
                data-testid="input-plan-price"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descreva as características do plano..."
              rows={3}
              data-testid="input-plan-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingPeriod">Período de Cobrança</Label>
              <Select
                value={formData.billingPeriod}
                onValueChange={(value) => handleChange("billingPeriod", value)}
              >
                <SelectTrigger data-testid="select-billing-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Ordem de Exibição</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 0)}
                placeholder="0"
                data-testid="input-sort-order"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxRestaurants">Máx. Restaurantes</Label>
              <Input
                id="maxRestaurants"
                type="number"
                value={formData.maxRestaurants}
                onChange={(e) => handleChange("maxRestaurants", parseInt(e.target.value) || 0)}
                min="1"
                required
                data-testid="input-max-restaurants"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxProducts">Máx. Produtos</Label>
              <Input
                id="maxProducts"
                type="number"
                value={formData.maxProducts}
                onChange={(e) => handleChange("maxProducts", parseInt(e.target.value) || 0)}
                min="1"
                required
                data-testid="input-max-products"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOrders">Máx. Pedidos/mês</Label>
              <Input
                id="maxOrders"
                type="number"
                value={formData.maxOrders}
                onChange={(e) => handleChange("maxOrders", parseInt(e.target.value) || 0)}
                min="1"
                required
                data-testid="input-max-orders"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
              data-testid="switch-plan-active"
            />
            <Label htmlFor="isActive">Plano ativo</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-plan"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-plan"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : plan ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}