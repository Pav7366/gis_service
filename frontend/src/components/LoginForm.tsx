import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    if (!formData.emailOrUsername.trim()) newErrors.emailOrUsername = 'Required';
    if (!formData.password) newErrors.password = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess(formData);
    }, 900);
  };

  return (
    <motion.div
      id="login-card-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      // PERFECT GLASSMORPHISM STYLES:
      className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-full max-w-md p-8 sm:p-10 rounded-[2rem] z-10"
    >
      {/* Header section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
          {isRegisterMode ? 'Create Account' : 'Sign In'}
        </h2>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        
        {/* Email Field */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-sm">
              Email or Username
            </label>
          </div>
          <input
            type="text"
            value={formData.emailOrUsername}
            onChange={(e) => handleChange('emailOrUsername', e.target.value)}
            placeholder="Enter your email or username"
            className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white text-sm font-medium placeholder:text-white/60 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-sm">
              Password
            </label>
            <button
              type="button"
              onClick={() => onOpenForgotPassword(formData.emailOrUsername)}
              className="text-xs font-bold text-white hover:text-gray-200 transition-colors drop-shadow-md"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 pr-11 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white text-sm font-medium placeholder:text-white/60 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/70 hover:text-white transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1 relative z-10">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
              className="w-4 h-4 rounded border-white/30 bg-white/20 text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-white drop-shadow-md">
              Remember me
            </span>
          </label>
        </div>

        {/* Action button */}
        <div className="pt-2 relative z-10">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg text-sm font-bold tracking-wide text-white bg-[#1e293b] hover:bg-[#0f172a] shadow-lg transition-all duration-200 active:scale-[0.99]"
          >
            <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 shrink-0 transform group-hover:translate-x-1" />}
          </button>
        </div>

        {/* Switch mode */}
        <div className="mt-4 pt-4 flex justify-between items-center text-xs relative z-10">
          <p className="text-white/80">
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="font-bold text-white hover:text-gray-200 transition-colors drop-shadow-sm"
          >
            {isRegisterMode ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};