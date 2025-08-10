'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import HeroBackground from './HeroBackground';
import SuiLogoWhite from './SuiLogoWhite';
import { useZkLogin } from '@/providers/ZkLoginProvider';

interface LoadingScreenProps {
  progress: number;
  onLoadingComplete: () => void;
  isComplete?: boolean;
}

export default function LoadingScreen({ progress, onLoadingComplete, isComplete = false }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const suiLogoRef = useRef<HTMLDivElement>(null);
  const { isFaucetLoading } = useZkLogin();

  useEffect(() => {
    if (!containerRef.current) return;

    // Logo appears immediately and starts pulsing
    gsap.set(suiLogoRef.current, {
      scale: 1,
      opacity: 1
    });

    // Start pulsing glow effect immediately
    startPulsingGlow();

  }, []);

  // Start pulsing glow animation
  const startPulsingGlow = () => {
    gsap.to(suiLogoRef.current, {
      filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.6))',
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut'
    });
  };

  // Handle completion animation
  useEffect(() => {
    if (isComplete && !isFaucetLoading) {
      animateToCompletion();
    }
  }, [isComplete, isFaucetLoading]);

  const animateToCompletion = () => {
    // Stop pulsing and zoom out
    gsap.killTweensOf(suiLogoRef.current);
    
    // Zoom and fade out logo
    gsap.to(suiLogoRef.current, {
      scale: 8,
      opacity: 0,
      filter: 'drop-shadow(0 0 60px rgba(255, 255, 255, 1)) drop-shadow(0 0 120px rgba(59, 130, 246, 1))',
      duration: 2,
      ease: 'power2.inOut',
      onComplete: () => {
        onLoadingComplete();
      }
    });
  };

  const getLoadingMessage = () => {
    if (isFaucetLoading) return 'Requesting testnet SUI...';
    if (progress < 25) return 'Connecting to Google...';
    if (progress < 50) return 'Authenticating with Enoki...';
    if (progress < 75) return 'Creating your Sui wallet...';
    if (progress < 85) return 'Setting up your account...';
    return 'Almost Ready...';
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black"
    >
      {/* Background - Dark Wavy Effect */}
      <div className="absolute inset-0">
        <HeroBackground 
          hueShift={25}
          noiseIntensity={0.1}
          scanlineIntensity={0}
          speed={1.5}
          warpAmount={0.2}
        />
      </div>

      {/* Sui Logo with Pulsing Glow */}
      <div 
        ref={suiLogoRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))'
        }}
      >
        <SuiLogoWhite className="w-28 h-28" />
      </div>

      {/* Progress Indicator */}
      {!isComplete && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center z-30">
          <div className="text-white text-sm mb-2">
            {getLoadingMessage()}
          </div>
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-white/60 text-xs mt-2">{Math.round(progress)}%</div>
          
          {/* Faucet indicator */}
          {isFaucetLoading && (
            <div className="mt-4 text-cyan-400 text-xs flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              Getting your first testnet SUI...
            </div>
          )}
        </div>
      )}

      {/* Completion Message */}
      {isComplete && !isFaucetLoading && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center z-30">
          <div className="text-white text-lg font-semibold mb-2">
            🎉 zkLogin Successful!
          </div>
          <div className="text-white/60 text-sm">
            Entering AidChain...
          </div>
        </div>
      )}
    </div>
  );
}