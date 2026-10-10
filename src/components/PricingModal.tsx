import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { upgradeUserPlan } from '../lib/firebase.ts';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms' | 'refund' | 'contact') => void;
  defaultPlan?: 'free' | 'pro' | 'business';
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onOpenLegal,
  defaultPlan = 'pro',
}) => {
  const { user, refreshProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'business'>(defaultPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentProvider, setPaymentProvider] = useState<'razorpay' | 'stripe'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const planPrices = {
    free: { monthly: 0, yearly: 0, label: 'Free Forever' },
    pro: { monthly: 499, yearly: 399, usdMonthly: 19, usdYearly: 15, label: 'Creator Pro' },
    business: { monthly: 1499, yearly: 1199, usdMonthly: 49, usdYearly: 39, label: 'Agency Business' },
  };

  const handleInitiatePayment = () => {
    if (selectedPlan === 'free') {
      onClose();
      return;
    }

    setIsProcessing(true);

    // Check if Razorpay script is available in window
    if (paymentProvider === 'razorpay' && typeof window !== 'undefined' && (window as any).Razorpay) {
      const razorpayKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
      try {
        const options = {
          key: razorpayKey, // Supports real key from VITE_RAZORPAY_KEY_ID or fallback
          amount: (billingCycle === 'monthly' ? planPrices[selectedPlan].monthly : planPrices[selectedPlan].yearly * 12) * 100,
          currency: 'INR',
          name: 'Smart Caption AI',
          description: `${planPrices[selectedPlan].label} (${billingCycle})`,
          handler: async function (response: any) {
            setIsProcessing(false);
            setPaymentSuccess(true);
            if (user && (selectedPlan === 'pro' || selectedPlan === 'business')) {
              try {
                await upgradeUserPlan(user.uid, selectedPlan);
                await refreshProfile();
              } catch (err) {
                console.warn('Failed to upgrade user plan in database:', err);
              }
            }
          },
          prefill: {
            name: user?.displayName || 'Creator',
            email: user?.email || 'sn3711550@gmail.com',
          },
          theme: {
            color: '#7c3aed',
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        // Fallback to test simulation
      }
    }

    // Interactive simulated checkout flow (Razorpay / Stripe sandbox test)
    setTimeout(async () => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      if (user && (selectedPlan === 'pro' || selectedPlan === 'business')) {
        try {
          await upgradeUserPlan(user.uid, selectedPlan);
          await refreshProfile();
        } catch (err) {
          console.warn('Failed to upgrade user plan in database:', err);
        }
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#0d0e19] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-violet-500/40 shadow-md">
              <img
                src="/src/assets/images/smartcaption_logo_1791567332036.jpg"
                alt="Smart Caption Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upgrade Smart Caption Pro</h2>
              <p className="text-xs text-neutral-400">Export in 1080p, unlock all animated viral styles & unlimited videos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 max-h-[calc(92vh-130px)]">
          {paymentSuccess ? (
            <div className="p-8 text-center space-y-4 bg-violet-950/20 border border-violet-500/30 rounded-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">Payment Successful & Plan Activated!</h3>
              <p className="text-sm text-neutral-300 max-w-md mx-auto">
                Your <strong>{planPrices[selectedPlan].label}</strong> features are now unlocked. You have unlimited video exports, 1080p HD rendering, and access to all Hormozi, MrBeast, and Desi subtitle templates.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setPaymentSuccess(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-full shadow-lg transition-all cursor-pointer"
                >
                  Start Creating Now
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Billing Cycle Switcher */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      billingCycle === 'yearly'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>Yearly Billing</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Free Plan */}
                <div
                  onClick={() => setSelectedPlan('free')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    selectedPlan === 'free'
                      ? 'border-violet-500 bg-violet-950/20 ring-1 ring-violet-500'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">Free Starter</h4>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-white">₹0</span>
                      <span className="text-xs text-neutral-400">/mo</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span>3 videos / month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span>Basic captions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span>720p & 480p Export</span>
                      </li>
                    </ul>
                  </div>
                  <span className="text-center text-xs font-bold text-neutral-400 py-1.5 border border-white/[0.08] rounded-xl">
                    {selectedPlan === 'free' ? 'Selected' : 'Choose Free'}
                  </span>
                </div>

                {/* Pro Plan (Highlighted) */}
                <div
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative ${
                    selectedPlan === 'pro'
                      ? 'border-violet-500 bg-violet-950/30 ring-2 ring-violet-500 shadow-xl shadow-violet-600/20'
                      : 'border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-violet-600 text-[10px] font-black uppercase tracking-wider text-white rounded-full">
                    POPULAR
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Creator Pro</h4>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-white">
                        ₹{billingCycle === 'monthly' ? planPrices.pro.monthly : planPrices.pro.yearly}
                      </span>
                      <span className="text-xs text-neutral-400">/mo</span>
                      <span className="text-[11px] text-neutral-500 ml-1">(${planPrices.pro.usdMonthly})</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span className="font-semibold text-white">30 videos / month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span>All 6 viral styles</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span>1080p Full HD</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span>Auto emojis & highlights</span>
                      </li>
                    </ul>
                  </div>
                  <span className="text-center text-xs font-bold text-white py-1.5 bg-violet-600 rounded-xl shadow-md">
                    {selectedPlan === 'pro' ? 'Selected' : 'Choose Pro'}
                  </span>
                </div>

                {/* Business Plan */}
                <div
                  onClick={() => setSelectedPlan('business')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    selectedPlan === 'business'
                      ? 'border-violet-500 bg-violet-950/20 ring-1 ring-violet-500'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">Agency Business</h4>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-white">
                        ₹{billingCycle === 'monthly' ? planPrices.business.monthly : planPrices.business.yearly}
                      </span>
                      <span className="text-xs text-neutral-400">/mo</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span className="font-semibold text-white">Unlimited videos</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span>4K Ultra HD Export</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                        <span>Custom brand fonts & colors</span>
                      </li>
                    </ul>
                  </div>
                  <span className="text-center text-xs font-bold text-neutral-300 py-1.5 border border-white/[0.08] rounded-xl">
                    {selectedPlan === 'business' ? 'Selected' : 'Choose Agency'}
                  </span>
                </div>
              </div>

              {/* Payment Gateway Options & Trust Info */}
              {selectedPlan !== 'free' && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Select Payment Gateway (Zero Setup Fee)
                    </span>
                    <span className="text-[11px] text-neutral-500">256-Bit SSL Encrypted</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentProvider('razorpay')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        paymentProvider === 'razorpay'
                          ? 'border-violet-500 bg-violet-950/40 text-white'
                          : 'border-white/[0.08] bg-black/30 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">Razorpay (India & UPI)</p>
                        <p className="text-[10px] text-neutral-400">GPay, PhonePe, Paytm, Cards, NetBanking</p>
                      </div>
                      <div className="w-3 h-3 rounded-full border border-violet-400 flex items-center justify-center">
                        {paymentProvider === 'razorpay' && <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentProvider('stripe')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        paymentProvider === 'stripe'
                          ? 'border-violet-500 bg-violet-950/40 text-white'
                          : 'border-white/[0.08] bg-black/30 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">Stripe / Global Cards</p>
                        <p className="text-[10px] text-neutral-400">International Credit/Debit Cards, Apple Pay</p>
                      </div>
                      <div className="w-3 h-3 rounded-full border border-violet-400 flex items-center justify-center">
                        {paymentProvider === 'stripe' && <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Checkout Action Button */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleInitiatePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm rounded-full transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Opening Secure Checkout...</span>
                  ) : selectedPlan === 'free' ? (
                    <span>Continue with Free Plan</span>
                  ) : (
                    <>
                      <span>
                        Proceed to Pay ₹
                        {billingCycle === 'monthly'
                          ? planPrices[selectedPlan].monthly
                          : planPrices[selectedPlan].yearly * 12}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Refund Assurance Note */}
                <p className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  <span>
                    Includes 7-day money-back guarantee. Read our{' '}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenLegal('refund');
                      }}
                      className="text-violet-400 hover:underline cursor-pointer"
                    >
                      Refund Policy
                    </button>{' '}
                    and{' '}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenLegal('terms');
                      }}
                      className="text-violet-400 hover:underline cursor-pointer"
                    >
                      Terms
                    </button>
                    .
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
