import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Settings } from "lucide-react";

interface SystemFeature {
  id: string;
  name: string;
  description: string;
  featureKey: string;
  category: string;
  isActive: boolean;
}

interface PlanFeature {
  planFeature: {
    id: string;
    planId: string;
    featureId: string;
    isIncluded: boolean;
  };
  feature: SystemFeature;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
}

interface PlanFeaturesModalProps {
  plan: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlanFeaturesModal({ plan, isOpen, onClose }: PlanFeaturesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as funcionalidades do sistema
  const { data: allFeatures } = useQuery<SystemFeature[]>({
    queryKey: ["/api/admin/features"],
    enabled: isOpen,
  });

  // Buscar funcionalidades já associadas ao plano
  const { data: planFeaturesData } = useQuery({
    queryKey: ["/api/admin/plans", plan.id, "features"],
    queryFn: () => apiRequest("GET", `/api/admin/plans/${plan.id}/features`),
    enabled: isOpen && !!plan.id,
  });

  // Garantir que planFeatures seja um array
  const planFeatures = Array.isArray(planFeaturesData) ? planFeaturesData : [];

  const updateFeatureMutation = useMutation({
    mutationFn: ({ featureId, isIncluded }: { featureId: string; isIncluded: boolean }) =>
      apiRequest("POST", `/api/admin/plans/${plan.id}/features`, { featureId, isIncluded }),
    onSuccess: () => {
      // Invalidar múltiplas queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans", plan.id, "features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
      toast({
        title: "Funcionalidade atualizada!",
        description: "A associação foi atualizada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar funcionalidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleFeature = (featureId: string, isIncluded: boolean) => {
    updateFeatureMutation.mutate({ featureId, isIncluded });
  };

  // Agrupar funcionalidades por categoria
  const groupedFeatures = allFeatures?.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, SystemFeature[]>) || {};

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      operations: "Operações",
      reporting: "Relatórios",
      marketing: "Marketing", 
      communication: "Comunicação",
      catalog: "Catálogo",
      logistics: "Logística",
    };
    return categories[category] || category;
  };

  const isFeatureIncluded = (featureId: string): boolean => {
    if (!Array.isArray(planFeatures)) return false;
    return planFeatures.some(pf => pf.feature.id === featureId && pf.planFeature.isIncluded) || false;
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Funcionalidades do Plano: {plan.name}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {plan.description} - {formatPrice(plan.price)}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Badge variant="outline" className="mr-3">
                    {getCategoryName(category)}
                  </Badge>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {features.filter(f => isFeatureIncluded(f.id)).length} de {features.length} incluídas
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {features.map((feature) => {
                  const isIncluded = isFeatureIncluded(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isIncluded 
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800"
                      }`}
                      data-testid={`feature-item-${feature.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {isIncluded ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-slate-400" />
                            )}
                            <div>
                              <h4 className="font-medium">{feature.name}</h4>
                              {feature.description && (
                                <p className="text-sm text-muted-foreground">
                                  {feature.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Chave: {feature.featureKey}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {!feature.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                          <Switch
                            checked={isIncluded}
                            onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                            disabled={updateFeatureMutation.isPending || !feature.isActive}
                            data-testid={`switch-feature-${feature.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-close-plan-features"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}