import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, login, isLoading } = useAuth();

  if (!showLoginModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={() => !isLoading && setShowLoginModal(false)}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <div className="relative px-8 pt-10 pb-6 text-center">
            <button
              onClick={() => !isLoading && setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <path d="M44 16C36 16 30 22 30 30C30 38 36 44 44 44C48 44 50 42 50 38C50 42 48 42 44 42C38 42 34 36 34 30C34 24 38 18 44 18C48 18 50 20 50 24C50 20 48 16 44 16Z" fill="white" />
                <rect x="8" y="26" width="14" height="4" rx="2" fill="white" opacity="0.7" />
                <rect x="8" y="34" width="10" height="4" rx="2" fill="white" opacity="0.7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to ColdRunners Business Intelligence</p>
          </div>

          <div className="px-8 pb-8 space-y-3">
            <button
              onClick={() => login('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] transition-all text-sm font-medium text-slate-700 disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => login('apple')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all text-sm font-medium text-white disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              <span>Continue with Apple</span>
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs text-slate-400">or</span>
              </div>
            </div>

            <button
              onClick={() => login('demo')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-sm font-medium text-white disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Continue as Demo</span>
              )}
            </button>
          </div>

          <div className="px-8 pb-6">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Secured with end-to-end encryption</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
