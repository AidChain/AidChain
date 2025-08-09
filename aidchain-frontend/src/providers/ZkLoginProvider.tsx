'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  useCurrentAccount, 
  useConnectWallet, 
  useDisconnectWallet,
  useWallets,
  useSignPersonalMessage,
} from '@mysten/dapp-kit';
import { isEnokiWallet, type EnokiWallet } from '@mysten/enoki';
import { FaucetService } from '@/lib/faucet';
import { useRouter } from 'next/navigation';

interface ZkLoginContextType {
  isAuthenticated: boolean;
  userAddress: string | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isFaucetLoading: boolean;
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>;
  enokiWallet: EnokiWallet | null;
}

const ZkLoginContext = createContext<ZkLoginContextType | null>(null);

export const ZkLoginProvider = ({ children }: { children: React.ReactNode }) => {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  const wallets = useWallets();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);

  // Get the Google Enoki wallet
  const enokiWallets = wallets.filter(isEnokiWallet);
  const googleWallet = enokiWallets.find(wallet => wallet.provider === 'google') || null;

  const isAuthenticated = !!currentAccount;
  const userAddress = currentAccount?.address || null;

  // ✅ Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && userAddress) {
      const currentPath = window.location.pathname;
      
      // If we're on the loading page, continue with faucet process
      if (currentPath === '/loading') {
        console.log('✅ Authentication complete on loading page');
        return;
      }
      
      // If we're anywhere else and just got authenticated, redirect to dashboard
      if (currentPath !== '/dashboard') {
        console.log('✅ Authentication complete, redirecting to dashboard');
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, userAddress, router]);

  // Request faucet SUI for new users (with balance check)
  useEffect(() => {
    if (!userAddress || !isAuthenticated) return;

    const requestFaucetSui = async () => {
      // Check if we've already handled faucet for this session
      const faucetRequested = sessionStorage.getItem(`faucetRequested_${userAddress}`);
      if (faucetRequested) return;

      try {
        setIsFaucetLoading(true);
        console.log('🔍 Checking if faucet request is needed...');
        
        const success = await FaucetService.requestTestnetSui(userAddress);
        
        if (success) {
          sessionStorage.setItem(`faucetRequested_${userAddress}`, 'true');
          console.log('✅ Faucet handling completed');
        } else {
          console.log('ℹ️ Faucet request not needed or failed');
        }
      } catch (error) {
        console.error('Faucet request failed:', error);
      } finally {
        setIsFaucetLoading(false);
      }
    };

    // Add a small delay to let authentication settle
    setTimeout(requestFaucetSui, 500);
  }, [userAddress, isAuthenticated]);

  const login = async () => {
    if (!googleWallet) {
      throw new Error('Google wallet not available');
    }

    setIsLoading(true);
    try {
      // ✅ Use Enoki's built-in OAuth flow
      connect({ wallet: googleWallet });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (userAddress) {
      sessionStorage.removeItem(`faucetRequested_${userAddress}`);
    }
    sessionStorage.removeItem('faucetRequested'); // Legacy cleanup
    disconnect();
  };

  const signPersonalMessage = async (message: Uint8Array): Promise<{ signature: string }> => {
    if (!isAuthenticated) {
      throw new Error('No valid session - please login first');
    }

    try {
      const result = await signMessage({ message });
      return { signature: result.signature };
    } catch (error) {
      console.error('Failed to sign personal message:', error);
      throw new Error('Failed to sign message');
    }
  };

  const value: ZkLoginContextType = {
    isAuthenticated,
    userAddress,
    login,
    logout,
    isLoading,
    isFaucetLoading,
    signPersonalMessage,
    enokiWallet: googleWallet,
  };

  return (
    <ZkLoginContext.Provider value={value}>
      {children}
    </ZkLoginContext.Provider>
  );
};

export const useZkLogin = () => {
  const context = useContext(ZkLoginContext);
  if (!context) {
    throw new Error('useZkLogin must be used within ZkLoginProvider');
  }
  return context;
};