'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import LoadingScreen from '@/components/LoadingScreen';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { completeLogin } = useZkLogin();
  
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const processZkLogin = async () => {
      try {
        const startTime = Date.now(); // Track when we started
        const MIN_LOADING_TIME = 10000; // 10 seconds minimum
        
        // Start progress animation
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90; // Stop at 90% until actual completion
            }
            return prev + Math.random() * 10; // Slower progress for longer observation
          });
        }, 300); // Slower interval for better observation

        // Get JWT from fragment
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const idToken = params.get('id_token');

        if (!idToken) {
          throw new Error('No ID token found in callback');
        }

        // Complete zkLogin process
        await completeLogin(idToken);
        
        // Calculate remaining time to reach minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
        
        // Set progress to 100% 
        setProgress(100);
        clearInterval(progressInterval);
        
        // Wait for remaining time, then mark as complete
        setTimeout(() => {
          setIsComplete(true);
        }, Math.max(1000, remainingTime)); // At least 1 second at 100%, or remaining time
        
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        router.push('/?error=oauth_failed');
      }
    };

    processZkLogin();
  }, [searchParams, router, completeLogin]);

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

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}