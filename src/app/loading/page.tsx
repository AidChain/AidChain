'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import LoadingScreen from '@/components/LoadingScreen';

export default function LoadingPage() {
  const router = useRouter();
  const { isAuthenticated, userAddress, isFaucetLoading } = useZkLogin();
  
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);

  // ✅ Monitor authentication status changes (this handles OAuth callback)
  useEffect(() => {
    if (isAuthenticated && userAddress && !authCompleted) {
      console.log('✅ Authentication successful, user address:', userAddress);
      setAuthCompleted(true);
      setProgress(85);
    }
  }, [isAuthenticated, userAddress, authCompleted]);

  // ✅ Handle faucet completion and final redirect
  useEffect(() => {
    if (authCompleted && !isFaucetLoading) {
      setProgress(100);
      
      setTimeout(() => {
        setIsComplete(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }, 800);
    }
  }, [authCompleted, isFaucetLoading, router]);

  // ✅ Auto progress animation before auth
  useEffect(() => {
    if (!authCompleted) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 75) {
            clearInterval(progressInterval);
            return 75; // Stop at 75% until authentication completes
          }
          return prev + Math.random() * 8;
        });
      }, 400);

      return () => clearInterval(progressInterval);
    }
  }, [authCompleted]);

  // ✅ Handle timeout - if stuck on loading page too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAuthenticated && !authCompleted) {
        console.log('⏰ OAuth timeout, redirecting back to home');
        router.push('/');
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [isAuthenticated, authCompleted, router]);

  return (
    <LoadingScreen 
      progress={progress}
      onLoadingComplete={() => router.push('/dashboard')}
      isComplete={isComplete}
    />
  );
}