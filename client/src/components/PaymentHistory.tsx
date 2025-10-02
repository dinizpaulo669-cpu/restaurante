import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, CreditCard, AlertCircle, QrCode, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface PaymentRecord {
  id: string;
  amount: string;
  method: string;
  status: string;
  paidAt: string;
  planStartDate: string;
  planEndDate: string;
  plan: {
    id: string;
    name: string;
    description: string;
  };
}

interface PendingPayment {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  expirationDate: string;
  billingPeriodMonths: number;
  plan: {
    id: string;
    name: string;
    description: string;
  };
}

interface PixPaymentDetails {
  id: string;
  amount: string;
  expirationDate: string;
  qrCodeImage: string;
  qrCodePayload: string;
  asaasPaymentId?: string;
}

interface CurrentPlanInfo {
  subscriptionPlan: string | null;
  planEndDate: string | null;
  isTrialActive: boolean;
  trialEndsAt: string | null;
}

interface PaymentHistoryData {
  paymentHistory: PaymentRecord[];
  pendingPayments: PendingPayment[];
  currentPlan: CurrentPlanInfo | null;
}

export function PaymentHistory({ restaurantId }: { restaurantId?: string }) {
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixDetails, setPixDetails] = useState<PixPaymentDetails | null>(null);
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<PaymentHistoryData>({
    queryKey: ["/api/payment-history", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/payment-history/${restaurantId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      return response.json();
    },
    enabled: !!restaurantId
  });

  const handleViewPixDetails = async (paymentId: string) => {
    setIsLoadingPix(true);
    try {
      const response = await fetch(`/api/pix/payment-details/${paymentId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch PIX details');
      }
      const details = await response.json();
      setPixDetails(details);
      setShowPixModal(true);
    } catch (error) {
      console.error('Error fetching PIX details:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do PIX",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPix(false);
    }
  };

  const handleCopyPixCode = async () => {
    if (!pixDetails?.qrCodePayload) return;
    
    try {
      await navigator.clipboard.writeText(pixDetails.qrCodePayload);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Error copying PIX code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código PIX",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Erro ao carregar histórico de pagamentos
      </div>
    );
  }

  const { paymentHistory, pendingPayments } = data;

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><AlertCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateDaysRemaining = (planEndDate: string | null) => {
    if (!planEndDate) return null;
    
    const now = new Date();
    const endDate = new Date(planEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = diffTime >= 0 
      ? Math.ceil(diffTime / (1000 * 60 * 60 * 24))  // Positivo: arredondar para cima
      : Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Negativo: arredondar para baixo
    
    return diffDays;
  };

  const getPlanStatusBadge = (daysRemaining: number | null, currentPlan: CurrentPlanInfo | null) => {
    if (!currentPlan) return null;

    if (currentPlan.isTrialActive) {
      const trialDays = currentPlan.trialEndsAt ? calculateDaysRemaining(currentPlan.trialEndsAt) : null;
      if (trialDays === null) {
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Trial sem data</Badge>;
      }
      if (trialDays > 0) {
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Trial - {trialDays} dias restantes
          </Badge>
        );
      }
      if (trialDays === 0) {
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            Trial vence hoje
          </Badge>
        );
      }
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Trial Expirado</Badge>;
    }

    if (daysRemaining === null) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Sem plano ativo</Badge>;
    }

    if (daysRemaining > 15) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {daysRemaining} dias restantes
        </Badge>
      );
    } else if (daysRemaining > 0) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          ⚠️ {daysRemaining} dias restantes
        </Badge>
      );
    } else if (daysRemaining === 0) {
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          ⚠️ Vence hoje
        </Badge>
      );
    } else if (daysRemaining >= -15) {
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          ⚠️ Vencido há {Math.abs(daysRemaining)} dias
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          🚫 Bloqueado - {Math.abs(daysRemaining)} dias de atraso
        </Badge>
      );
    }
  };

  const hasAnyData = paymentHistory.length > 0 || pendingPayments.length > 0;

  if (!hasAnyData && !data?.currentPlan) {
    return (
      <div className="text-center p-8">
        <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum pagamento encontrado</h3>
        <p className="text-muted-foreground">
          Seus pagamentos e renovações aparecerão aqui quando você adquirir um plano.
        </p>
      </div>
    );
  }

  const daysRemaining = data?.currentPlan?.planEndDate ? calculateDaysRemaining(data.currentPlan.planEndDate) : null;

  return (
    <div className="space-y-4">
      {/* Status do Plano Atual */}
      {data?.currentPlan && (
        <Card className="border-2 border-primary">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-lg">Plano Atual</h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {data.currentPlan.subscriptionPlan || 'Nenhum plano ativo'}
                </p>
                {data.currentPlan.planEndDate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Vence em: {format(new Date(data.currentPlan.planEndDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
              <div className="text-right">
                {getPlanStatusBadge(daysRemaining, data.currentPlan)}
                {daysRemaining !== null && daysRemaining < 0 && daysRemaining >= -15 && (
                  <p className="text-xs text-orange-600 mt-2">
                    Sistema será bloqueado em {15 + daysRemaining} dias
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Pagamentos Pendentes */}
      {pendingPayments.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-orange-800 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Pagamentos Pendentes
          </h4>
          {pendingPayments.map((payment) => (
            <Card key={payment.id} className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium">Plano {payment.plan.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      {payment.billingPeriodMonths} {payment.billingPeriodMonths === 1 ? 'mês' : 'meses'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gerado em: {formatDate(payment.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expira em: {formatDate(payment.expirationDate)}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-lg font-bold text-orange-700">
                      {formatCurrency(payment.amount)}
                    </div>
                    {getStatusBadge(payment.status)}
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewPixDetails(payment.id)}
                        disabled={isLoadingPix}
                        className="text-xs"
                        data-testid={`button-view-pix-${payment.id}`}
                      >
                        {isLoadingPix ? (
                          <Clock className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Eye className="w-3 h-3 mr-1" />
                        )}
                        Ver PIX
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico de Pagamentos */}
      {paymentHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-green-800 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Pagamentos Concluídos
          </h4>
          {paymentHistory.map((payment) => (
            <Card key={payment.id} className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium">Plano {payment.plan.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      Método: {payment.method.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pago em: {formatDate(payment.paidAt)}
                    </p>
                    <div className="text-sm text-muted-foreground mt-2">
                      <div>Período: {format(new Date(payment.planStartDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(payment.planEndDate), "dd/MM/yyyy", { locale: ptBR })}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-700">
                      {formatCurrency(payment.amount)}
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de Detalhes do PIX */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Detalhes do PIX
            </DialogTitle>
          </DialogHeader>
          
          {pixDetails && (
            <div className="space-y-4 pb-4">
              <div className="text-center">
                <img
                  src={pixDetails.qrCodeImage}
                  alt="QR Code PIX"
                  className="mx-auto max-w-full h-auto border rounded"
                  data-testid="img-pix-qr-code"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-bold">{formatCurrency(pixDetails.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vencimento:</span>
                  <span>{formatDate(pixDetails.expirationDate)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Ou copie o código PIX:
                </Label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixDetails.qrCodePayload}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs border rounded bg-gray-50"
                    data-testid="input-pix-payload"
                  />
                  <Button
                    onClick={handleCopyPixCode}
                    size="sm"
                    variant="outline"
                    data-testid="button-copy-pix-payload"
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
              onClick={() => setShowPixModal(false)}
              variant="outline"
              data-testid="button-close-pix-modal"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}