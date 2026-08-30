import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { LoginFormData, FormErrors } from '../types';

interface LoginFormProps {
  onSuccess: (data: LoginFormData) => void;
  onOpenForgotPassword: (email?: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onOpenForgotPassword,
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    emailOrUsername: '',
    password: '',
    rememberMe: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or username is required';
    } else if (formData.emailOrUsername.trim().length < 3) {
      newErrors.emailOrUsername = 'Please enter at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onSuccess(formData);
    }, 900);
  };

  const handleAutoFill = () => {
    setFormData({
      emailOrUsername: 'alex@nexus.com',
      password: 'NexusSecure2026!',
      rememberMe: true,
    });
    setErrors({});
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-neutral-200 dark:bg-neutral-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-neutral-200 dark:bg-neutral-700' };
    }
  };

  const pwdStrength = getPasswordStrength(formData.password);

  return (
    <motion.div
      id="login-card-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-full max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl p-8 sm:p-12 shadow-2xl rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800"
    >
      {/* Header section */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
          {isRegisterMode ? 'Create Account' : 'Sign In'}
        </h2>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email or Username Combined Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="email-or-username-input"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200"
            >
              Email or Username
            </label>
            {formData.emailOrUsername.length >= 3 && !errors.emailOrUsername && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Valid
              </span>
            )}
          </div>
          <input
            id="email-or-username-input"
            type="text"
            name="emailOrUsername"
            autoComplete="username"
            value={formData.emailOrUsername}
            onChange={(e) => handleChange('emailOrUsername', e.target.value)}
            placeholder="Enter your email or username"
            className={`w-full px-4 py-3 bg-neutral-100 dark:bg-slate-800 border rounded-md text-neutral-900 dark:text-white text-sm sm:text-base font-normal placeholder:text-neutral-400 dark:placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
              errors.emailOrUsername
                ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-neutral-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.emailOrUsername && (
            <p className="text-xs text-rose-500 flex items-center gap-1 font-medium pt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.emailOrUsername}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="password-input"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200"
            >
              Password
            </label>
            <button
              type="button"
              id="forgot-password-link"
              onClick={() => onOpenForgotPassword(formData.emailOrUsername)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Enter your password"
              className={`w-full px-4 py-3 pr-11 bg-neutral-100 dark:bg-slate-800 border rounded-md text-neutral-900 dark:text-white text-sm sm:text-base font-normal placeholder:text-neutral-400 dark:placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'border-neutral-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            <button
              type="button"
              id="toggle-password-visibility-btn"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength meter */}
          {formData.password.length > 0 && (
            <div className="pt-1 flex items-center gap-2">
              <div className="flex-1 grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-colors ${
                      step <= pwdStrength.score
                        ? pwdStrength.color
                        : 'bg-neutral-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium text-neutral-600 dark:text-slate-300">
                {pwdStrength.label}
              </span>
            </div>
          )}

          {errors.password && (
            <p className="text-xs text-rose-500 flex items-center gap-1 font-medium pt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember me toggle */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              id="remember-me-checkbox"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Remember me
            </span>
          </label>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-600/20 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </div>

        {/* Switch mode */}
        <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs sm:text-sm">
          <p className="text-neutral-500 dark:text-neutral-400">
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            type="button"
            id="switch-auth-mode-btn"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrors({});
            }}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            {isRegisterMode ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
