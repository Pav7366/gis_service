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

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-white/20' };
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
        return { score: 3, label: 'Good', color: 'bg-[#c3b091]' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-white/20' };
    }
  };

  const pwdStrength = getPasswordStrength(formData.password);

  return (
    <motion.div
      id="login-card-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      // We apply the custom glass-card class here, alongside standard structural tailwind classes
      className="glass-card w-full max-w-lg p-8 sm:p-12 z-10"
    >
      {/* Header section */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
          {isRegisterMode ? 'Create Account' : 'Sign In'}
        </h2>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email or Username Combined Field */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex justify-between items-center">
            <label
              htmlFor="email-or-username-input"
              className="text-xs font-semibold uppercase tracking-wider text-white/90 drop-shadow-sm"
            >
              Email or Username
            </label>
            {formData.emailOrUsername.length >= 3 && !errors.emailOrUsername && (
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
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
            className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-md text-white text-sm sm:text-base font-normal placeholder:text-white/50 transition-all focus:outline-none focus:ring-2 ${
              errors.emailOrUsername
                ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 text-rose-300'
                : 'border-white/30 focus:border-[#c3b091] focus:ring-[#c3b091]'
            }`}
          />
          {errors.emailOrUsername && (
            <p className="text-xs text-rose-400 flex items-center gap-1 font-medium pt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.emailOrUsername}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex justify-between items-center">
            <label
              htmlFor="password-input"
              className="text-xs font-semibold uppercase tracking-wider text-white/90 drop-shadow-sm"
            >
              Password
            </label>
            <button
              type="button"
              id="forgot-password-link"
              onClick={() => onOpenForgotPassword(formData.emailOrUsername)}
              className="text-xs font-bold text-white hover:text-gray-200 transition-colors cursor-pointer drop-shadow-md"

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
              className={`w-full px-4 py-3 pr-11 bg-white/10 backdrop-blur-sm border rounded-md text-white text-sm sm:text-base font-normal placeholder:text-white/50 transition-all focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 text-rose-300'
                  : 'border-white/30 focus:border-[#c3b091] focus:ring-[#c3b091]'
              }`}
            />
            <button
              type="button"
              id="toggle-password-visibility-btn"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white transition cursor-pointer"
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
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium text-white/80">
                {pwdStrength.label}
              </span>
            </div>
          )}

          {errors.password && (
            <p className="text-xs text-rose-400 flex items-center gap-1 font-medium pt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember me toggle */}
        <div className="flex items-center justify-between pt-1 relative z-10">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              id="remember-me-checkbox"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
              className="w-4 h-4 rounded border-white/30 bg-white/10 text-[#c3b091] focus:ring-[#c3b091] focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-sm">
              Remember me
            </span>
          </label>
        </div>

        {/* Action button */}
        <div className="pt-2 relative z-10">
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-md text-sm font-semibold tracking-wide text-[#f5f5dc] bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-[#c3b091] shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 shrink-0 transform group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Switch mode */}
        <div className="mt-6 pt-5 border-t border-white/20 flex justify-between items-center text-xs sm:text-sm relative z-10">
          <p className="text-white/80">
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            type="button"
            id="switch-auth-mode-btn"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrors({});
            }}
              className="font-semibold text-white hover:text-gray-200 transition-colors cursor-pointer drop-shadow-sm"
          >
            {isRegisterMode ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};