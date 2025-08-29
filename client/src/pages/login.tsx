import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha",
        variant: "destructive",
      });
      return;
    }

    // Verificar se existe um usuário cadastrado com este email
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      toast({
        title: "Usuário não encontrado",
        description: "Email não cadastrado. Faça seu cadastro primeiro.",
        variant: "destructive",
      });
      return;
    }

    const user = JSON.parse(currentUser);
    if (user.email !== formData.email) {
      toast({
        title: "Email incorreto",
        description: "Email não encontrado em nossos registros.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login realizado!",
      description: `Bem-vindo de volta, ${user.name}!`,
    });

    // Redirecionar baseado no tipo do usuário
    if (user.type === 'customer') {
      setLocation("/customer-panel");
    } else if (user.type === 'restaurant') {
      setLocation("/restaurant-panel");
    } else {
      setLocation("/customer-panel"); // padrão
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary" data-testid="login-title">
              Entrar
            </CardTitle>
            <p className="text-muted-foreground" data-testid="login-subtitle">
              Acesse sua conta no RestaurantePro
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10"
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-login"
              >
                Entrar
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{" "}
                  <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
                    Cadastre-se
                  </Link>
                </p>
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