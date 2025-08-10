'use client';

import { useState } from 'react';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import GradientBorderButton from './GradientBorderButton';
import { useRouter } from 'next/navigation';

interface WalletButtonProps {
  variant?: 'login' | 'donate';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const WalletButton = ({ 
  variant = 'login', 
  className, 
  size 
}: WalletButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();
  
  const { 
    isAuthenticated, 
    userAddress, 
    login,
    logout,
    isLoading 
  } = useZkLogin();

  const handleConnect = async () => {
    if (isAnimating || isLoading) return;
    
    setIsAnimating(true);
    
    try {
      console.log('🔍 Starting OAuth flow...');
      
      // ✅ Call login and let ZkLoginProvider handle navigation
      await login();
      
      // ✅ Don't redirect here - let the provider handle it
      console.log('✅ OAuth completed successfully');
      
    } catch (error) {
      console.error('❌ Login failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleDisconnect = () => {
    logout();
    router.push('/');
  };

  if (isAuthenticated && userAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm font-mono"> 
          {userAddress}
        </div>
        <GradientBorderButton
          onClick={handleDisconnect}
          className={`wallet-button ${className}`}
          size={size}
        >
          Disconnect
        </GradientBorderButton>
      </div>
    );
  }

  return (
    <GradientBorderButton
      onClick={handleConnect}
      className={`wallet-button ${className}`}
      size={size}
      disabled={isAnimating || isLoading}
    >
      {isAnimating || isLoading ? 'Connecting...' : variant === 'login' ? 'Login with Google' : 'Connect Wallet'}
    </GradientBorderButton>
  );
};

export default WalletButton;