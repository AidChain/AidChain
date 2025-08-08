'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ZkLoginService } from '@/lib/zklogin';
import { FaucetService } from '@/lib/faucet';
import { suiClient } from '@/lib/sui-transactions';

interface ZkLoginContextType {
  zkLoginService: ZkLoginService;
  isAuthenticated: boolean;
  userAddress: string | null;
  login: () => Promise<void>;
  logout: () => void;
  completeLogin: (jwt: string) => Promise<any>;
  isLoading: boolean;
  isFaucetLoading: boolean;
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>;
}

const ZkLoginContext = createContext<ZkLoginContextType | null>(null);

export const ZkLoginProvider = ({ children }: { children: React.ReactNode }) => {
  const [zkLoginService] = useState(() => new ZkLoginService(suiClient));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const storedAddress = sessionStorage.getItem('zkLoginAddress');
      const storedState = sessionStorage.getItem('zkLoginComplete');
      const storedZkLoginState = sessionStorage.getItem('zkLoginState');
      
      if (storedAddress && storedState && storedZkLoginState) {
        try {
          // Restore the full zkLogin state
          const loginState = JSON.parse(storedZkLoginState);
          const storedJWT = sessionStorage.getItem('zkLoginJWT');
          
          if (storedJWT && loginState) {
            // Restore the state in zkLoginService
            zkLoginService.restoreState(storedJWT, loginState);
            
            setIsAuthenticated(true);
            setUserAddress(storedAddress);
            
            console.log('✅ Restored zkLogin session with keypair');
          }
        } catch (error) {
          console.error('Failed to restore zkLogin session:', error);
          // Clear invalid session data
          logout();
        }
      }
    };

    checkExistingSession();
  }, [zkLoginService]);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Initialize zkLogin flow
      const { loginUrl, state } = await zkLoginService.initializeZkLogin();
      
      // Store login state in sessionStorage
      sessionStorage.setItem('zkLoginState', JSON.stringify(state));
      
      // Redirect to Google OAuth
      window.location.href = loginUrl;
    } catch (error) {
      console.error('zkLogin failed:', error);
      setIsLoading(false);
    }
  }, [zkLoginService]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUserAddress(null);
    sessionStorage.removeItem('zkLoginState');
    sessionStorage.removeItem('zkLoginJWT'); // ✅ Clear JWT
    sessionStorage.removeItem('zkLoginAddress');
    sessionStorage.removeItem('zkLoginComplete');
    sessionStorage.removeItem('faucetRequested');
  }, []);

  // Method to complete login (called from callback)
  const completeLogin = useCallback(async (jwt: string) => {
    try {
      const loginState = JSON.parse(sessionStorage.getItem('zkLoginState') || '{}');
      const zkState = await zkLoginService.completeZkLogin(jwt, loginState);
      
      setIsAuthenticated(true);
      setUserAddress(zkState.zkLoginUserAddress);
      
      // Store session - including JWT for restoration
      sessionStorage.setItem('zkLoginAddress', zkState.zkLoginUserAddress);
      sessionStorage.setItem('zkLoginComplete', 'true');
      sessionStorage.setItem('zkLoginJWT', jwt); // ✅ Store JWT for restoration

      // Request testnet SUI for new users (run in background)
      requestFaucetSui(zkState.zkLoginUserAddress);
      
      return zkState;
    } catch (error) {
      console.error('Failed to complete zkLogin:', error);
      throw error;
    }
  }, [zkLoginService]);

  // Request faucet SUI in background
  const requestFaucetSui = useCallback(async (address: string) => {
    // Check if we already requested faucet for this session
    const faucetRequested = sessionStorage.getItem('faucetRequested');
    if (faucetRequested) return;

    try {
      setIsFaucetLoading(true);
      
      // Check current balance first
      const balance = await suiClient.getBalance({ owner: address });
      const currentBalance = parseInt(balance.totalBalance);
      
      // Only request faucet if balance is very low (less than 0.1 SUI)
      if (currentBalance < 100_000_000) { // 0.1 SUI in MIST
        console.log('🚰 Requesting testnet SUI from faucet...');
        
        const success = await FaucetService.requestTestnetSui(address);
        
        if (success) {
          sessionStorage.setItem('faucetRequested', 'true');
          console.log('✅ Faucet request completed');
        }
      } else {
        console.log('💰 User already has sufficient SUI balance');
      }
    } catch (error) {
      console.error('Faucet request failed:', error);
    } finally {
      setIsFaucetLoading(false);
    }
  }, []);

  const signPersonalMessage = async (message: Uint8Array) => {
    if (!zkLoginService.hasValidSession()) {
      throw new Error('No valid session - please login first');
    }

    const keypair = zkLoginService.getKeypair();
    if (!keypair) {
      throw new Error('No keypair available');
    }
    
    try {
      // Sign the message using the ephemeral keypair
      const signatureResult = await keypair.signPersonalMessage(message);
      console.log('✅ Signed personal message:', signatureResult);
      
      // Return just the signature bytes that Seal expects
      return { 
        signature: signatureResult.signature // This should be the raw signature string
      };
    } catch (error) {
      console.error('Failed to sign personal message:', error);
      throw new Error('Failed to sign message');
    }
  };

  const value: ZkLoginContextType = {
    zkLoginService,
    isAuthenticated,
    userAddress,
    login,
    logout,
    completeLogin,
    isLoading,
    isFaucetLoading,
    signPersonalMessage,
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