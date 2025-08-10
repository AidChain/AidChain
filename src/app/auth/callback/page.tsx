'use client';

import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    // This page should only be shown briefly in the popup
    // Enoki will handle closing the popup and returning control to the parent
    console.log('📱 OAuth callback page loaded in popup');
    
    // Optional: Add a simple message for users who see this briefly
    const timer = setTimeout(() => {
      // Fallback: if popup doesn't close automatically, close it
      if (window.opener) {
        window.close();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Completing authentication...</p>
        <p className="text-white/60 text-sm mt-2">This window will close automatically</p>
      </div>
    </div>
  );
}