import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setResendCountdown(60);
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1000);
  };

  const handleResetForm = () => {
    setStatus('idle');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          id="forgot-password-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          id="forgot-password-modal"
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-8 sm:p-10 text-neutral-900 dark:text-white z-10"
        >
          {status === 'success' ? (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-[0.35em] text-emerald-500 font-extrabold">
                  Transmission Complete
                </span>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-neutral-950 dark:text-white">
                  Reset Dispatched
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                  We have dispatched secure recovery credentials to the specified network endpoint:
                </p>
                <div className="mt-3 py-3 px-4 bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white break-all border-l-2 border-black dark:border-white">
                  {email}
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={resendCountdown > 0}
                  onClick={handleResetForm}
                  className={`w-full py-3 px-4 text-xs font-bold uppercase tracking-widest border transition-colors ${
                    resendCountdown > 0
                      ? 'border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-800 dark:text-neutral-200 cursor-pointer'
                  }`}
                >
                  {resendCountdown > 0 ? `Resend In ${resendCountdown}s` : 'Modify Target Email'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer"
                >
                  Return To Authentication
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.35em] text-blue-600 dark:text-blue-400 font-extrabold">
                    Identity Recovery
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-neutral-950 dark:text-white">
                    Reset Password
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Enter the authorized email to regenerate access credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-neutral-400 hover:text-black dark:hover:text-white p-2 font-mono text-sm uppercase transition cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200 block">
                    Target Account Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your email address"
                    className={`w-full px-4 py-3 bg-neutral-100 dark:bg-slate-800 border rounded-md text-neutral-900 dark:text-white text-sm sm:text-base font-normal placeholder:text-neutral-400 dark:placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
                      error
                        ? 'border-rose-500 focus:ring-rose-500 text-rose-600'
                        : 'border-neutral-300 dark:border-slate-700 focus:border-blue-500'
                    }`}
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-rose-500 flex items-center gap-1 font-medium pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {error}
                    </p>
                  )}
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-md border border-neutral-300 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-slate-700 text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-70 cursor-pointer"
                  >
                    {status === 'loading' ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>Send Link</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};