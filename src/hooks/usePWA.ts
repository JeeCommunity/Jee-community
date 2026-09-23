import { useState, useEffect } from 'react';

let globalDeferredPrompt: any = null;
let globalIsInstallable = false;
let listeners: Array<() => void> = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  globalDeferredPrompt = e;
  globalIsInstallable = true;
  notifyListeners();
});

window.addEventListener('appinstalled', () => {
  globalDeferredPrompt = null;
  globalIsInstallable = false;
  notifyListeners();
});

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(globalIsInstallable);

  useEffect(() => {
    const listener = () => setIsInstallable(globalIsInstallable);
    listeners.push(listener);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      globalIsInstallable = false;
      setIsInstallable(false);
    }

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const installPWA = async () => {
    if (!globalDeferredPrompt) return null;
    globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    if (outcome === 'accepted') {
      globalIsInstallable = false;
      globalDeferredPrompt = null;
      notifyListeners();
    }
    return outcome;
  };

  return { isInstallable, installPWA };
}
