'use client';

import { useState } from 'react';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import GradientBorderButton from './GradientBorderButton';
import gsap from 'gsap';
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
      // Run animation first (GSAP returns a Promise when awaited)
      await gsap.to('.wallet-button', {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      });
      
      // Then handle login
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleDisconnect = () => {
    logout(); // Your existing logout function
    router.push('/'); // Redirect to landing page
  };

  if (isAuthenticated && userAddress) {
    const displayAddress = userAddress;

    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm font-mono">
          {displayAddress}
          <span className="ml-2 text-xs">zkLogin Wallet Address</span>
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
      disabled={isAnimating || isLoading}
      size={size}
    >
      {isLoading ? 'Connecting...' : 
       variant === 'login' ? 'Log In' : 'Donate Now'}
    </GradientBorderButton>
  );
};