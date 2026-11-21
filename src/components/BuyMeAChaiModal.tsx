import React, { useState, useEffect } from 'react';
import {
  Coffee,
  X,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Heart,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';
import {
  ChaiSupporterRecord,
  saveSupabaseChaiSupport,
  createSupabaseNotification,
} from '../lib/supabaseHub';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void;
      on: (event: string, handler: (resp: any) => void) => void;
    };
  }
}

interface BuyMeAChaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  supporters: ChaiSupporterRecord[];
  onSupportCompleted: (record: ChaiSupporterRecord) => void;
}

const CHAI_TIERS = [
  { id: '1', cups: 1, label: 'Cutting Chai', amount: 19 },
  { id: '2', cups: 2, label: 'Masala Chai', amount: 39 },
  { id: '5', cups: 5, label: 'Cold Coffee', amount: 99 },
  { id: '10', cups: 10, label: 'Tapri Treat', amount: 199 },
];

let razorpayScriptPromise: Promise<boolean> | null = null;

function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

function formatRelativeTime(ms: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function BuyMeAChaiModal({
  isOpen,
  onClose,
  supporters,
  onSupportCompleted,
}: BuyMeAChaiModalProps) {
  const { user, profile } = useAuth();
  const [selectedTierId, setSelectedTierId] = useState<string>('2');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('51');
  const [supporterName, setSupporterName] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<ChaiSupporterRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSupporterName((prev) => prev || profile?.fullName || user?.displayName || '');
      setConfigError(null);
      // Preload Razorpay script in the background while user chooses Chai count
      loadRazorpayCheckoutScript();
    } else {
      setCompletedReceipt(null);
      setIsProcessing(false);
    }
  }, [isOpen, profile?.fullName, user?.displayName]);

  const activeTier = CHAI_TIERS.find((t) => t.id === selectedTierId) || CHAI_TIERS[1];
  const parsedCustom = Math.round(Number(customAmountInput) || 0);
  const effectiveAmount = isCustomAmount ? parsedCustom : activeTier.amount;
  const effectiveCups = isCustomAmount
    ? Math.max(1, Math.round(effectiveAmount / 19))
    : activeTier.cups;

  const totalCups = supporters.reduce((acc, item) => acc + (Number(item.cups) || 1), 0);

  const handlePayWithRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);

    if (!Number.isFinite(effectiveAmount) || effectiveAmount < 10) {
      toast.error('Minimum support amount ₹10 hai.');
      return;
    }
    if (effectiveAmount > 50000) {
      toast.error('Maximum single payment ₹50,000 hai.');
      return;
    }

    const displayName = supporterName.trim() || profile?.fullName || 'JEE Student';
    const noteText = message.trim();

    setIsProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error('Razorpay Checkout load nahi ho paya. Apna internet check karein.');
        setIsProcessing(false);
        return;
      }

      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          cups: effectiveCups,
          supporterName: displayName,
          message: noteText,
          userId: user?.uid || 'guest',
        }),
      });

      const orderData = await orderRes.json().catch(() => ({}));

      if (!orderRes.ok) {
        if (orderData?.error === 'RAZORPAY_NOT_CONFIGURED') {
          setConfigError(
            orderData?.message ||
              'Razorpay keys abhi server par add nahi hui hain (RAZORPAY_KEY_ID aur RAZORPAY_KEY_SECRET).'
          );
        } else {
          toast.error(orderData?.message || 'Razorpay order create nahi ho paya.');
        }
        setIsProcessing(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'JEE Community',
        description: `Buy Me a Chai (${effectiveCups} ${effectiveCups === 1 ? 'Chai' : 'Chai'})`,
        order_id: orderData.orderId,
        prefill: {
          name: displayName,
          email: user?.email || '',
        },
        notes: {
          supporterName: displayName,
          cups: String(effectiveCups),
          message: noteText,
        },
        theme: {
          color: '#D97706',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));

            if (!verifyRes.ok || !verifyData?.verified) {
              toast.error(verifyData?.message || 'Payment verification fail ho gaya.');
              setIsProcessing(false);
              return;
            }

            const savedRecord = await saveSupabaseChaiSupport({
              supporterName: displayName,
              userId: user?.uid || 'guest',
              userAvatar: profile?.photoURL || '',
              cups: effectiveCups,
              amountInr: effectiveAmount,
              message: noteText,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });

            onSupportCompleted(savedRecord);
            setCompletedReceipt(savedRecord);
            setMessage('');
            toast.success(`Waah ${displayName}! Chai mil gayi, dil khush ho gaya!`);

            // Notify community admin (0 Firebase Reads - Supabase notification)
            createSupabaseNotification({
              recipientId: 'admin',
              senderId: user?.uid || 'guest',
              senderName: displayName,
              senderAvatar: profile?.photoURL || '',
              type: 'status_reply',
              commentContent: `Bought ${effectiveCups} Chai (₹${effectiveAmount})${
                noteText ? `: "${noteText}"` : ''
              }`,
              targetUrl: '/community',
            }).catch(() => {});
          } catch (verifyErr) {
            console.error('Chai verification error:', verifyErr);
            toast.error('Payment confirm karne me issue aaya. Kripya Admin ko contact karein.');
          } finally {
            setIsProcessing(false);
          }
        },
      });

      rzp.on('payment.failed', (failureResp: any) => {
        const reason =
          failureResp?.error?.description || 'Payment complete nahi ho paya. Dobara try karein.';
        toast.error(reason);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      toast.error('Payment start nahi ho paya. Kripya thodi der baad try karein.');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[340] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                    Buy Me a Chai / Coffee
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Raat 2 baje bhi app chala raha hu, ek chai toh banti hai
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="min-w-[40px] min-h-[40px] rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {completedReceipt ? (
                <div className="py-4 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Waah {completedReceipt.supporterName}, Dil Jeet Liya!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Aapki{' '}
                      <span className="font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                        ₹{completedReceipt.amountInr}
                      </span>{' '}
                      ({completedReceipt.cups} Chai) ki treat mil gayi. Ab coding 2x speed pe chalegi!
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3 text-left text-xs space-y-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Receipt ID</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                        {completedReceipt.paymentId}
                      </span>
                    </div>
                    {completedReceipt.message && (
                      <div className="pt-1 border-t border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300">
                        &ldquo;{completedReceipt.message}&rdquo;
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompletedReceipt(null)}
                    className="w-full min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors"
                  >
                    Mast! Wapas Chalo
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePayWithRazorpay} className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Server ka bill aur late-night coding dono chai-coffee ke bharose chal rahi hai.
                    Agar app se thodi bhi help mili ho, toh Admin ko ek garma-garam chai ya coffee
                    pila do!
                  </p>

                  {/* Preset Chai Tier Cards */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Kya Pilaoge?
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCustomAmount((prev) => !prev)}
                        className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap"
                      >
                        {isCustomAmount ? 'Menu dekho' : 'Apni marzi se ₹ daalo'}
                      </button>
                    </div>

                    {!isCustomAmount ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CHAI_TIERS.map((tier) => {
                          const selected = selectedTierId === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => setSelectedTierId(tier.id)}
                              className={`min-h-[64px] rounded-xl border px-2 py-2.5 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                selected
                                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-700'
                              }`}
                            >
                              <span className="text-[11px] font-semibold whitespace-nowrap">
                                {tier.label}
                              </span>
                              <span className="text-base font-bold tabular-nums">
                                ₹{tier.amount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                          <IndianRupee className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          min={10}
                          max={50000}
                          step={1}
                          value={customAmountInput}
                          onChange={(e) => setCustomAmountInput(e.target.value)}
                          placeholder="Kitne rupay ki chai? (min ₹10)"
                          className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500 tabular-nums"
                        />
                      </div>
                    )}
                  </div>

                  {/* Supporter Details */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Tumhara Naam
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={supporterName}
                        onChange={(e) => setSupporterName(e.target.value)}
                        placeholder="e.g. Future IITian / Aarav"
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Koi Funny / Sweet Message (Optional)
                      </label>
                      <textarea
                        rows={2}
                        maxLength={200}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Bhai mast app hai, lo chai piyo aur padhai karwao..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Inline Setup Notice if Server Env Vars Not Yet Added */}
                  {configError && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">Chai Tapri Abhi Setup Ho Rahi Hai</p>
                        <p className="leading-relaxed opacity-90">{configError}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing || effectiveAmount < 10}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Chai garam ho rahi hai...</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="w-4 h-4 shrink-0" />
                        <span className="tabular-nums">
                          ₹{effectiveAmount > 0 ? effectiveAmount : 0} ki Chai Pila Do
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>100% safe &amp; instant · Sidha Admin ke chai fund mein</span>
                  </div>
                </form>
              )}

              {/* Recent Supporters Wall */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Heart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Chai Pilane Wale Legends</span>
                  </div>
                  {totalCups > 0 && (
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                      {totalCups} chai pilayi gayi
                    </span>
                  )}
                </div>

                {supporters.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    Abhi kisi ne chai nahi pilayi... Pehle legend tum ban jao!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {supporters.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-3 py-2 flex items-start gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {(item.supporterName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {item.supporterName}
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 tabular-nums whitespace-nowrap shrink-0">
                              {item.cups} Chai · ₹{item.amountInr}
                            </span>
                          </div>
                          {item.message && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">
                              {item.message}
                            </p>
                          )}
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatRelativeTime(item.createdAtMs)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
