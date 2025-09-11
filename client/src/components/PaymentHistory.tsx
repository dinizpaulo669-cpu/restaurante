import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, CreditCard, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface PaymentHistoryData {
  paymentHistory: PaymentRecord[];
  pendingPayments: PendingPayment[];
}

export function PaymentHistory({ restaurantId }: { restaurantId?: string }) {
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

  const hasAnyData = paymentHistory.length > 0 || pendingPayments.length > 0;

  if (!hasAnyData) {
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

  return (
    <div className="space-y-4">
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
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-700">
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
    </div>
  );
}