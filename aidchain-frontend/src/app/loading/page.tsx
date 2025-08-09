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

  // Monitor authentication status changes
  useEffect(() => {
    if (isAuthenticated && userAddress && !authCompleted) {
      console.log('✅ Authentication successful, user address:', userAddress);
      setAuthCompleted(true);
      
      // Set progress to 85% when authenticated
      setProgress(85);
    }
  }, [isAuthenticated, userAddress, authCompleted]);

  // Handle faucet completion
  useEffect(() => {
    if (authCompleted && !isFaucetLoading) {
      // Complete the progress
      setProgress(100);
      
      setTimeout(() => {
        setIsComplete(true);
      }, 1000);
    }
  }, [authCompleted, isFaucetLoading]);

  // Auto progress animation
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

  const handleLoadingComplete = () => {
    router.push('/dashboard');
  };

  return (
    <LoadingScreen 
      progress={progress}
      onLoadingComplete={handleLoadingComplete}
      isComplete={isComplete}
    />
  );
}