import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, LogOut } from 'lucide-react';
import { LoginFormData } from '../types';

interface SuccessViewProps {
  formData: LoginFormData;
  onLogout: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ formData, onLogout }) => {
  return (
    <motion.div
      id="login-success-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-full max-w-lg bg-white dark:bg-neutral-900 p-8 sm:p-12 shadow-2xl rounded-none sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-white"
    >
      <div className="space-y-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Session Authorized
          </span>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950 dark:text-white mt-1">
            Access Granted
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Encrypted synchronization established with gateway nodes.
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-b border-neutral-200 dark:border-neutral-800 py-6 space-y-4 text-xs sm:text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
            Account Identifier
          </span>
          <span className="font-mono font-bold text-neutral-900 dark:text-white">
            {formData.emailOrUsername || formData.username || formData.email}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
            Session Policy
          </span>
          <span className="text-[11px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
            {formData.rememberMe ? 'Persistent Token' : 'Standard Session'}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          id="logout-btn"
          onClick={onLogout}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-rose-600 dark:hover:bg-rose-600 dark:hover:text-white text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-md"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
};
