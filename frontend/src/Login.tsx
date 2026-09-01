import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from './components/LoginForm';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { LoginFormData } from './types';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);

  const handleLoginSuccess = (data: LoginFormData) => {
    navigate('/map'); 
  };

  return (
    <div className="relative min-h-screen w-full bg-neutral-900 text-white flex flex-col justify-center overflow-x-hidden font-sans">
      
      {/* Background Image Loading the local car-bg.jpg */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.img 
          src="/car-bg.jpg" 
          alt="Highway Background" 
          initial={{ scale: 1.04, opacity: 0.8 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.7, ease: 'easeOut' }} 
          className="w-full h-full object-cover object-center" 
        />
        {/* Subtle dark overlay to ensure text is readable */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-8 sm:px-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Side: Text */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center select-none pt-20 lg:pt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-2">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              ROAD TRACK
            </h1>
            <p className="text-white/90 text-lg sm:text-xl font-medium drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]">
              Better Data. Better Roads. Better Cities.
            </p>
          </motion.div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end pb-20 lg:pb-0">
          <LoginForm 
            onSuccess={handleLoginSuccess} 
            onOpenForgotPassword={() => setIsForgotModalOpen(true)} 
          />
        </div>
        
      </main>

      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} initialEmail="" />
    </div>
  );
}