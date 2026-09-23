import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePWA } from '../hooks/usePWA';
import toast from 'react-hot-toast';

export default function InstallAppButton() {
  const { isInstallable, installPWA } = usePWA();
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await installPWA();
      if (outcome === 'accepted') {
        toast.success("Installation started! The app 'JEE Community' will be added to your home screen or app drawer shortly.");
      }
    } else {
      // Fallback for iOS or when beforeinstallprompt is not available
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
         toast("To install the app on iOS: tap the Share button at the bottom of the screen and select 'Add to Home Screen'.");
      } else {
         toast("To install the app, please use the 'Add to Home Screen' or 'Install' option from your browser's menu.");
      }
    }
  };

  return (
    <button
      onClick={handleInstallClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white",
        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 rounded-full",
        "transition-colors shadow-sm whitespace-nowrap self-center"
      )}
    >
      <Download size={14} />
      <span>Install App</span>
    </button>
  );
}
