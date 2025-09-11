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

interface SystemFeature {
  id?: string;
  name: string;
  description: string;
  featureKey: string;
  category: string;
  isActive: boolean;
}

interface FeatureModalProps {
  feature?: SystemFeature;
  isOpen: boolean;
  onClose: () => void;
}

export default function FeatureModal({ feature, isOpen, onClose }: FeatureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SystemFeature>({
    name: "",
    description: "",
    featureKey: "",
    category: "operations",
    isActive: true,
  });

  useEffect(() => {
    if (feature) {
      setFormData(feature);
    } else {
      setFormData({
        name: "",
        description: "",
        featureKey: "",
        category: "operations",
        isActive: true,
      });
    }
  }, [feature, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: SystemFeature) => apiRequest("POST", "/api/admin/features", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
      toast({
        title: "Funcionalidade criada!",
        description: "A funcionalidade foi criada com sucesso",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar funcionalidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate feature key from name if not provided
    if (!formData.featureKey && formData.name) {
      const key = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      setFormData(prev => ({ ...prev, featureKey: key }));
    }
    createMutation.mutate(formData);
  };

  const handleChange = (field: keyof SystemFeature, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateFeatureKey = () => {
    if (formData.name) {
      const key = formData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      handleChange("featureKey", key);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle data-testid="feature-modal-title">
            {feature ? "Editar Funcionalidade" : "Criar Funcionalidade"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Funcionalidade</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: Relatórios de Lucro, Sistema de Cupons"
              required
              data-testid="input-feature-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descreva o que essa funcionalidade faz..."
              rows={3}
              data-testid="input-feature-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="featureKey">Chave da Funcionalidade</Label>
              <div className="flex space-x-2">
                <Input
                  id="featureKey"
                  value={formData.featureKey}
                  onChange={(e) => handleChange("featureKey", e.target.value)}
                  placeholder="profit_reports"
                  required
                  data-testid="input-feature-key"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateFeatureKey}
                  data-testid="button-generate-key"
                >
                  Gerar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger data-testid="select-feature-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operations">Operações</SelectItem>
                  <SelectItem value="reporting">Relatórios</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="communication">Comunicação</SelectItem>
                  <SelectItem value="catalog">Catálogo</SelectItem>
                  <SelectItem value="logistics">Logística</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
              data-testid="switch-feature-active"
            />
            <Label htmlFor="isActive">Funcionalidade ativa</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-feature"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-save-feature"
            >
              {createMutation.isPending ? "Salvando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}