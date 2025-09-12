import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Smartphone, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const checkInstalled = () => {
      // Verifica se está rodando como PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      // Verificar se o usuário já rejeitou a instalação
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Mostrar novamente após 7 dias
        if (daysDiff < 7) {
          return;
        }
      }
    };

    // Alterar dinamicamente o manifest para o controle
    const updateManifest = () => {
      const isControlePage = window.location.pathname.includes('/controle') || 
                            window.location.pathname.includes('/dashboard');
      
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink && isControlePage) {
        manifestLink.href = '/manifest-controle.json';
      } else if (manifestLink && !isControlePage) {
        manifestLink.href = '/manifest.json';
      }
    };

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      console.log('PWA: Install prompt available');
      event.preventDefault();
      setDeferredPrompt(event);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    updateManifest();
    checkInstalled();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('PWA: User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('PWA: Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Instruções manuais para iOS
  const showIOSInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS && !isInstalled && !deferredPrompt;
  };

  if (isInstalled) {
    return (
      <Card className="bg-green-50 border-green-200 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-green-800">App Instalado</h3>
              <p className="text-sm text-green-600">
                RestaurantePro está instalado em seu dispositivo! 🎉
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showIOSInstructions()) {
    return (
      <Card className="bg-blue-50 border-blue-200 mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-800 mb-2">
                  Instalar no iOS
                </h3>
                <div className="text-sm text-blue-600 space-y-1">
                  <p>1. Toque no ícone de compartilhar (□↗) no Safari</p>
                  <p>2. Role para baixo e toque em "Adicionar à Tela de Início"</p>
                  <p>3. Toque em "Adicionar" para instalar o app</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-800 mb-1">
                Instalar RestaurantePro
              </h3>
              <p className="text-sm text-blue-600 mb-3">
                Instale o app em seu celular para acesso rápido e experiência otimizada
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-install-pwa"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Instalar App
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  data-testid="button-dismiss-pwa"
                >
                  Agora não
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}