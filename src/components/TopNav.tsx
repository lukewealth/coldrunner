import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Bell,
  Menu,
  Sparkles,
  Wifi,
  WifiOff,
  Radio,
  LogOut,
  User,
  ChevronDown,
  Settings,
  Cpu,
  Terminal,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAgentRunning: boolean;
  apiHealth: 'ok' | 'degraded' | 'offline';
  notificationCount: number;
  onToggleNotifications: () => void;
  onToggleSidebar: () => void;
  sseConnected: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  isAgentRunning,
  apiHealth,
  notificationCount,
  onToggleNotifications,
  onToggleSidebar,
  sseConnected,
}) => {
  const { user, isAuthenticated, logout, setShowLoginModal } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const healthColor = apiHealth === 'ok' ? 'bg-emerald-500' : apiHealth === 'degraded' ? 'bg-amber-500' : 'bg-red-500';
  const HealthIcon = apiHealth === 'offline' ? WifiOff : Wifi;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <span className={`w-1.5 h-1.5 rounded-full ${healthColor} ${apiHealth === 'ok' ? '' : 'animate-pulse'}`} />
            <HealthIcon className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-[11px]">
              {isAgentRunning ? 'Agents Active' : 'System Ready'}
            </span>
          </div>

          {sseConnected && (
            <div className="hidden md:flex items-center space-x-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] text-emerald-700 font-mono font-bold">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('search')}
            className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
            title="Start a new business search"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Search</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleNotifications}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            title="View notifications"
          >
            <Bell className="w-[18px] h-[18px] text-slate-500" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </motion.span>
            )}
          </motion.button>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

          <div className="relative" ref={menuRef}>
            {isAuthenticated ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 pr-2 rounded-xl hover:bg-slate-100 transition-colors"
                title="User account menu"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{user?.provider === 'google' ? 'Google' : user?.provider === 'apple' ? 'Apple' : 'Demo'}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLoginModal(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </motion.button>
            )}

            <AnimatePresence>
              {showUserMenu && isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('agents-memory'); setShowUserMenu(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <span>Agent Memory</span>
                    </button>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
