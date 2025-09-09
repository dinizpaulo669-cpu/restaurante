import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CouponsSectionProps {
  restaurantId: string;
}

export function CouponsSection({ restaurantId }: CouponsSectionProps) {
  const { toast } = useToast();
  
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/coupons`],
    enabled: !!restaurantId
  });

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Cupom copiado!",
      description: `Código ${code} copiado para a área de transferência`,
    });
  };

  if (isLoading) return null;
  if (!coupons || coupons.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Cupons Disponíveis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon: any) => (
            <Card key={coupon.id} className="border-2 border-green-200 bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-green-100 text-green-800 font-mono font-bold"
                      >
                        {coupon.code}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyCoupon(coupon.code)}
                        className="h-6 w-6 p-0"
                        data-testid={`button-copy-${coupon.code}`}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {coupon.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {coupon.discountType === "percentage" 
                          ? `${coupon.discountValue}% OFF`
                          : `R$ ${parseFloat(coupon.discountValue).toFixed(2)} OFF`
                        }
                      </Badge>
                      
                      {coupon.minOrderValue && (
                        <span className="text-xs text-gray-500">
                          Mín. R$ {parseFloat(coupon.minOrderValue).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Válido até: {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}