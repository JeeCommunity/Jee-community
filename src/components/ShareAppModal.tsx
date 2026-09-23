import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, Check, Share2, MessageCircle, Download } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ShareAppModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = "https://jee-community.netlify.app"; // Updated to production Netlify URL

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err?.message || 'Error');
    }
  };

  const shareOnWhatsApp = () => {
    const text = `Join me on JEE Community! 🚀\n\nCheck it out here: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'JEE Community',
          text: 'Join me on JEE Community! 🚀',
          url: shareUrl
        });
      } catch (err) {
        console.error('Error sharing:', err?.message || 'Error');
      }
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "jee-community-qr.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share with friends
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
            Scan this QR code or share the link to invite others to this page.
          </p>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 shadow-sm mb-4">
            <QRCodeCanvas 
              id="qr-code-canvas"
              value={shareUrl} 
              size={180}
              level={"H"}
              includeMargin={true}
              bgColor={"#ffffff"}
              fgColor={"#0f172a"}
            />
          </div>
          
          <button 
            onClick={downloadQRCode}
            className="mb-6 text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download QR Code
          </button>

          <div className="w-full flex items-center gap-2 mb-4">
            <div className="flex-1 truncate bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              {shareUrl}
            </div>
            <button 
              onClick={handleCopy}
              className={cn(
                "p-2.5 rounded-lg text-white font-medium transition-all shrink-0 flex items-center justify-center",
                copied ? "bg-green-500 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"
              )}
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="w-full grid grid-cols-2 gap-3">
            <button 
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </button>
            <button 
              onClick={nativeShare}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
