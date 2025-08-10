'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import LoadingScreen from '@/components/LoadingScreen';

export default function LoadingPage() {
  const router = useRouter();
  const { isAuthenticated, userAddress, isFaucetLoading } = useZkLogin();
  
  const [progress, setProgress] = useState(20); // Start higher since auth is already done
  const [isComplete, setIsComplete] = useState(false);

  // ✅ If user isn't authenticated and lands here, redirect back
  useEffect(() => {
    if (!isAuthenticated && !userAddress) {
      console.log('⚠️ No authentication found on loading page, redirecting home');
      router.push('/');
      return;
    }
  }, [isAuthenticated, userAddress, router]);

  // ✅ Start progress animation since we know auth is complete
  useEffect(() => {
    if (isAuthenticated && userAddress) {
      console.log('✅ Authentication confirmed, starting faucet process...');
      
      // Animate progress while faucet is running
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85; // Stop at 85% until faucet completes
          }
          return prev + Math.random() * 10;
        });
      }, 300);

      return () => clearInterval(progressInterval);
    }
  }, [isAuthenticated, userAddress]);

  // ✅ Handle faucet completion and final redirect
  useEffect(() => {
    if (isAuthenticated && userAddress && !isFaucetLoading) {
      setProgress(100);
      
      setTimeout(() => {
        setIsComplete(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }, 800);
    }
  }, [isAuthenticated, userAddress, isFaucetLoading, router]);

  // ✅ Only render if authenticated
  if (!isAuthenticated || !userAddress) {
    return null; // Prevent flash while redirecting
  }

  return (
    <LoadingScreen 
      progress={progress}
      onLoadingComplete={() => router.push('/dashboard')}
      isComplete={isComplete}
    />
  );
}