import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'apple' | 'demo';
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: 'google' | 'apple' | 'demo') => Promise<void>;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  showLoginModal: false,
  setShowLoginModal: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('coldrunners_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const login = useCallback(async (provider: 'google' | 'apple' | 'demo') => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    const profiles: Record<string, UserProfile> = {
      google: {
        id: 'google-' + Date.now(),
        name: 'Luke Okagha',
        email: 'luke@coldrunners.ai',
        avatar: '',
        provider: 'google',
      },
      apple: {
        id: 'apple-' + Date.now(),
        name: 'Luke Okagha',
        email: 'luke@coldrunners.ai',
        avatar: '',
        provider: 'apple',
      },
      demo: {
        id: 'demo-' + Date.now(),
        name: 'Demo User',
        email: 'demo@coldrunners.ai',
        avatar: '',
        provider: 'demo',
      },
    };

    const profile = profiles[provider];
    setUser(profile);
    localStorage.setItem('coldrunners_user', JSON.stringify(profile));
    setIsLoading(false);
    setShowLoginModal(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('coldrunners_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
