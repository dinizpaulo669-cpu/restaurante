import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Home } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    pontoReferencia: ""
  });
  
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.cep || !formData.rua || !formData.numero) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome, email, telefone, CEP, rua e número",
        variant: "destructive",
      });
      return;
    }

    // Concatenar endereço completo
    const endereco = `${formData.rua}, ${formData.numero}${formData.pontoReferencia ? ` - ${formData.pontoReferencia}` : ''} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}, CEP: ${formData.cep}`;

    // Salvar dados do cliente no localStorage
    localStorage.setItem('currentUser', JSON.stringify({
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: endereco,
      type: 'customer'
    }));

    toast({
      title: "Cadastro realizado!",
      description: "Bem-vindo ao RestaurantePro!",
    });

    // Redirecionar para o painel do cliente
    setLocation("/customer-panel");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCepChange = async (cep: string) => {
    setFormData(prev => ({ ...prev, cep }));
    
    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }));
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique se o CEP está correto",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao buscar CEP",
          description: "Não foi possível consultar o endereço",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary" data-testid="register-title">
              Criar Conta
            </CardTitle>
            <p className="text-muted-foreground" data-testid="register-subtitle">
              Cadastre-se para começar a pedir comida
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10"
                    data-testid="input-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Telefone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              {/* Seção de Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-primary" />
                  Endereço de Entrega
                </h3>
                
                {/* CEP */}
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-sm font-medium">CEP *</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      data-testid="input-cep"
                    />
                    {isLoadingCep && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Rua */}
                <div className="space-y-2">
                  <Label htmlFor="rua" className="text-sm font-medium">Rua / Logradouro *</Label>
                  <Input
                    id="rua"
                    value={formData.rua}
                    onChange={(e) => handleInputChange("rua", e.target.value)}
                    placeholder="Nome da rua"
                    required
                    data-testid="input-rua"
                  />
                </div>

                {/* Número e Bairro */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero" className="text-sm font-medium">Número *</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => handleInputChange("numero", e.target.value)}
                      placeholder="123"
                      required
                      data-testid="input-numero"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bairro" className="text-sm font-medium">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => handleInputChange("bairro", e.target.value)}
                      placeholder="Bairro"
                      data-testid="input-bairro"
                    />
                  </div>
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-sm font-medium">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange("cidade", e.target.value)}
                      placeholder="Cidade"
                      data-testid="input-cidade"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-sm font-medium">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleInputChange("estado", e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                      data-testid="input-estado"
                    />
                  </div>
                </div>

                {/* Ponto de Referência */}
                <div className="space-y-2">
                  <Label htmlFor="pontoReferencia" className="text-sm font-medium">Ponto de Referência</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pontoReferencia"
                      value={formData.pontoReferencia}
                      onChange={(e) => handleInputChange("pontoReferencia", e.target.value)}
                      placeholder="Ex: Próximo ao mercado, em frente à escola..."
                      className="pl-10"
                      data-testid="input-ponto-referencia"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-register"
              >
                Criar Conta
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setLocation("/")}
                  data-testid="button-back-home"
                >
                  ← Voltar para início
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}