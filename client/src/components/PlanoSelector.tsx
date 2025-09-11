import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Clock, CreditCard, QrCode } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

interface PixPaymentResponse {
  success: boolean;
  paymentId: string;
  qrCodePayload: string;
  qrCodeImage: string;
  amount: number;
  expirationDate: string;
  asaasPaymentId: string;
}

export function PlanoSelector({ restaurantId }: { restaurantId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingPeriod, setBillingPeriod] = useState("1");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PixPaymentResponse | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Query para buscar planos disponíveis
  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Mutation para criar pagamento PIX
  const createPixPaymentMutation = useMutation({
    mutationFn: async ({ planId, billingPeriodMonths }: { planId: string, billingPeriodMonths: number }) => {
      return await apiRequest("POST", "/api/pix/create-payment", {
        planId,
        billingPeriodMonths,
      }) as PixPaymentResponse;
    },
    onSuccess: (data) => {
      setPaymentData(data);
      setShowPaymentModal(true);
      toast({
        title: "PIX gerado com sucesso!",
        description: "Escaneie o QR Code ou copie o código PIX para pagar.",
      });
    },
    onError: (error: any) => {
      console.error("Error creating PIX payment:", error);
      toast({
        title: "Erro ao gerar PIX",
        description: error?.message || "Não foi possível gerar o pagamento PIX. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = async () => {
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Por favor, escolha um plano para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPayment(true);
    try {
      await createPixPaymentMutation.mutateAsync({
        planId: selectedPlan,
        billingPeriodMonths: parseInt(billingPeriod),
      });
    } catch (error) {
      console.error("Error in handleSelectPlan:", error);
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCopyPixCode = () => {
    if (paymentData?.qrCodePayload) {
      navigator.clipboard.writeText(paymentData.qrCodePayload);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu app de pagamento para finalizar.",
      });
    }
  };

  const getDiscountedPrice = (originalPrice: string, months: number): number => {
    const price = parseFloat(originalPrice);
    if (months === 6) return price * months * 0.9; // 10% desconto
    if (months === 12) return price * months * 0.8; // 20% desconto
    return price * months;
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Seleção de Plano */}
        <div>
          <Label htmlFor="plan-select" className="text-base font-medium">
            Escolha seu plano:
          </Label>
          <div className="grid gap-4 mt-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
                data-testid={`card-plan-${plan.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        R$ {plan.price}/mês
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Seleção de Período */}
        <div className="space-y-3">
          <Label htmlFor="billing-period" className="text-base font-medium">
            Período de cobrança:
          </Label>
          <Select value={billingPeriod} onValueChange={setBillingPeriod}>
            <SelectTrigger data-testid="select-billing-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mês</SelectItem>
              <SelectItem value="6">
                6 meses 
                <Badge variant="secondary" className="ml-2">10% OFF</Badge>
              </SelectItem>
              <SelectItem value="12">
                12 meses
                <Badge variant="secondary" className="ml-2">20% OFF</Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumo do valor */}
        {selectedPlan && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total a pagar:</span>
                <div className="text-right">
                  {(() => {
                    const plan = plans.find(p => p.id === selectedPlan);
                    if (!plan) return null;
                    const originalTotal = parseFloat(plan.price) * parseInt(billingPeriod);
                    const discountedTotal = getDiscountedPrice(plan.price, parseInt(billingPeriod));
                    const hasDiscount = originalTotal !== discountedTotal;

                    return (
                      <div>
                        {hasDiscount && (
                          <div className="text-sm line-through text-muted-foreground">
                            R$ {originalTotal.toFixed(2)}
                          </div>
                        )}
                        <div className="text-xl font-bold text-blue-600">
                          R$ {discountedTotal.toFixed(2)}
                        </div>
                        {hasDiscount && (
                          <div className="text-xs text-green-600">
                            Economia de R$ {(originalTotal - discountedTotal).toFixed(2)}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão para gerar PIX */}
        <Button
          onClick={handleSelectPlan}
          disabled={!selectedPlan || isCreatingPayment || createPixPaymentMutation.isPending}
          className="w-full"
          size="lg"
          data-testid="button-generate-pix"
        >
          {isCreatingPayment || createPixPaymentMutation.isPending ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Gerando PIX...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              Gerar PIX
            </>
          )}
        </Button>
      </div>

      {/* Modal de Pagamento PIX */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Pagamento PIX
            </DialogTitle>
          </DialogHeader>
          
          {paymentData && (
            <div className="space-y-4">
              <div className="text-center">
                <img
                  src={paymentData.qrCodeImage}
                  alt="QR Code PIX"
                  className="mx-auto max-w-full h-auto border rounded"
                  data-testid="img-qr-code"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-bold">R$ {paymentData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vencimento:</span>
                  <span>{new Date(paymentData.expirationDate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Ou copie o código PIX:
                </Label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentData.qrCodePayload}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs border rounded bg-gray-50"
                    data-testid="input-pix-code"
                  />
                  <Button
                    onClick={handleCopyPixCode}
                    size="sm"
                    variant="outline"
                    data-testid="button-copy-pix"
                  >
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Após o pagamento, seu plano será ativado automaticamente.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
              data-testid="button-close-modal"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}