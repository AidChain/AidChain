import React, { useState } from 'react';
import UserProfileCard from "@/components/UserProfileCard";

export default function RecipientContent() {
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
      <div className="flex flex-col pt-8 pb-8 pr-8 pl-8 md:pl-0 h-full w-full gap-8 md:ml-72">
        <div className="flex flex-col gap-2 flex-shrink-0">
          <h2 className="text-white text-3xl sm:text-4xl font-semibold">Welcome back, 
          <span className="text-transparent bg-gradient-to-r from-teal-200 to-blue-500 bg-clip-text"> {username}</span>
          .</h2>
          <p className="text-md sm:text-lg text-slate-300">
            Your transparent donation platform dashboard.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0"> {/* Changed h-full to flex-1 and added min-h-0 */}
          <div className="flex flex-2 flex-col h-full gap-6">
            <div className="flex-shrink-0"> {/* Wrap UserProfileCard to prevent it from shrinking */}
              <UserProfileCard onShowSnackbar={showSnackbar} />
            </div>
            <div className="flex flex-col gap-3 flex-1 min-h-0"> {/* Added min-h-0 */}
              <div className='flex justify-between items-center'>
                <h3 className="text-white text-xl sm:text-2xl font-medium flex-shrink-0">Quick Donate</h3>
                <p className='text-sm text-slate-400'>VIEW ALL</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ul className="h-full w-full overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30 pb-2">
                  {
                  }
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-3 flex-col">
            <div className="flex min-h-full w-full bg-gray-800/50 backdrop-blur-lg border border-blue-400/40 rounded-xl p-6 flex flex-col hover:shadow-xl
        hover:shadow-blue-500/50 transition-all duration-300 ease-in-out">
            </div>
          </div>
      </div>
    </div>
  );
};