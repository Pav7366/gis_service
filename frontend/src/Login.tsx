import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoginForm } from './components/LoginForm';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { SuccessView } from './components/SuccessView';
import { BACKGROUND_PRESETS } from "./data/backgrounds";
import { LoginFormData } from './types';
import { Upload, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STORAGE_BG_KEY = 'portal_custom_road_bg';

export default function Login() {
  const navigate = useNavigate();
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [selectedBgId, setSelectedBgId] = useState<string>(BACKGROUND_PRESETS[0].id);
  const [imgError, setImgError] = useState<boolean>(false);
  const [loggedInUser, setLoggedInUser] = useState<LoginFormData | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);

  const activePreset = BACKGROUND_PRESETS.find((p) => p.id === selectedBgId) || BACKGROUND_PRESETS[0];
  const currentBgUrl = customBg || (imgError ? BACKGROUND_PRESETS[0].url : activePreset.url);

  const handleLoginSuccess = (data: LoginFormData) => {
    setLoggedInUser(data);
    setTimeout(() => { navigate('/map'); }, 1500); // Redirects to GIS Dashboard
  };

  const handleLogout = () => setLoggedInUser(null);

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white flex flex-col justify-between overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.img key={currentBgUrl} src={currentBgUrl} alt="Background" initial={{ scale: 1.04, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-black/35 lg:to-black/25" />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 py-8 lg:py-12 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        <div className="w-full lg:w-[55%] flex flex-col justify-end py-4 select-none">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white drop-shadow-lg">LOGIN PORTAL</h1>
            <p className="text-neutral-200/90 max-w-md text-base sm:text-lg leading-relaxed drop-shadow">Better Data. Better Roads. Better Cities.</p>
          </motion.div>
        </div>
        <div className="w-full lg:w-[45%] flex justify-center lg:justify-end">
          <AnimatePresence mode="wait">
            {loggedInUser ? (
              <SuccessView key="success-view" formData={loggedInUser} onLogout={handleLogout} />
            ) : (
              <LoginForm key="login-form" onSuccess={handleLoginSuccess} onOpenForgotPassword={() => setIsForgotModalOpen(true)} />
            )}
          </AnimatePresence>
        </div>
      </main>
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} initialEmail="" />
    </div>
  );
}