import React, { useState } from 'react';
import UserProfileCard from "@/components/UserProfileCard";
import Snackbar from "@/components/Snackbar";

export default function DonorContent() {
  const username = "Test User"

  const [snackbars, setSnackbars] = useState<Array<{
      id: number;
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
      isVisible: boolean;
    }>>([]);
  
    const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      const id = Date.now();
      setSnackbars(prev => [...prev, { id, message, type, isVisible: true }]);
    };
  
    const closeSnackbar = (id: number) => {
      setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
    };

  return (
    <>
      <div className="flex flex-col pt-8 pb-8 pr-8 h-full w-full gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-3xl sm:text-4xl font-semibold">Welcome back, 
          <span className="text-transparent bg-gradient-to-r from-teal-200 to-blue-500 bg-clip-text"> {username}</span>
          .</h2>
          <p className="text-md sm:text-lg text-slate-300">
            Your transparent donation platform dashboard.
          </p>
        </div>
        <div className="flex flex-row gap-8 h-full w-full">
          <div className="flex flex-2 flex-col h-inherit">
            <UserProfileCard onShowSnackbar={showSnackbar} />
          </div>
          <div className="flex flex-3 flex-col bg-blue-400 h-inherit"></div>
        </div>
      </div>

      {/* Snackbar Container - Fixed Bottom Right */}
      <div className="fixed bottom-4 right-48 z-50 space-y-2">
        {snackbars.map((snackbar, index) => (
          <div
            key={snackbar.id}
            style={{
              transform: `translateY(${index * -70}px)` // Stack multiple snackbars upward
            }}
          >
            <Snackbar
              message={snackbar.message}
              type={snackbar.type}
              isVisible={snackbar.isVisible}
              onClose={() => closeSnackbar(snackbar.id)}
              position="bottom"
            />
          </div>
        ))}
      </div>
    </>
  );
};