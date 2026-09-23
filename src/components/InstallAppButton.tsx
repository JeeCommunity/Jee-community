import React, { useState, useEffect } from 'react';
import { Download, ExternalLink } from 'lucide-react';
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
    <div className="flex flex-col items-center sm:items-start gap-1 py-0.5">
      <button
        onClick={handleInstallClick}
        title="Download / Install JEE Community App"
        className={cn(
          "flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-bold text-white",
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 rounded-full",
          "transition-all shadow-sm whitespace-nowrap"
        )}
      >
        <Download size={12} />
        <span>Download Karwa Version</span>
      </button>

      <a
        href="https://jee-community.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
        title="Open Latest Netlify App"
        className={cn(
          "flex items-center justify-center gap-1 px-3 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300",
          "bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 rounded-full",
          "transition-all shadow-xs whitespace-nowrap"
        )}
      >
        <ExternalLink size={11} />
        <span>Use Latest Version App</span>
      </a>
    </div>
  );
}
