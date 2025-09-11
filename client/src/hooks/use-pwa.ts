import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar se PWA é suportado (removido PushManager para compatibilidade com iOS Safari)
    const isPWASupported = 'serviceWorker' in navigator;
    setIsSupported(isPWASupported);

    // Verificar se já está instalado (modo standalone)
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
      
      setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome);
    };

    checkIfInstalled();

    // Registrar service worker
    if (isPWASupported) {
      registerServiceWorker();
    }

    // Event listeners
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA: App installed successfully');
    };

    const handleVisibilityChange = () => {
      checkIfInstalled();
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('PWA: Service Worker registered successfully:', registration);

      // Verificar por atualizações
      registration.addEventListener('updatefound', () => {
        console.log('PWA: New service worker available');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('PWA: New content is available, please refresh');
              // Aqui você pode mostrar uma notificação para o usuário
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('PWA: Service Worker registration failed:', error);
      return null;
    }
  };

  const installPWA = async () => {
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available');
      return false;
    }

    try {
      // Mostrar prompt de instalação
      await deferredPrompt.prompt();
      
      // Aguardar escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA: User choice: ${outcome}`);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA: Installation failed:', error);
      return false;
    }
  };

  const updateServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('PWA: Service Worker updated');
        
        // Enviar mensagem para pular espera
        if (registration.waiting) {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data.success) {
              window.location.reload();
            }
          };
          
          registration.waiting.postMessage(
            { type: 'SKIP_WAITING' },
            [messageChannel.port2]
          );
        }
      }
    } catch (error) {
      console.error('PWA: Service Worker update failed:', error);
    }
  };

  const getCacheInfo = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        const messageChannel = new MessageChannel();
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          
          registration.active!.postMessage(
            { type: 'GET_CACHE_SIZE' },
            [messageChannel.port2]
          );
        });
      }
    } catch (error) {
      console.error('PWA: Failed to get cache info:', error);
      return null;
    }
  };

  return {
    isSupported,
    isInstallable,
    isInstalled,
    installPWA,
    updateServiceWorker,
    getCacheInfo,
    canInstall: isSupported && isInstallable && !isInstalled
  };
}