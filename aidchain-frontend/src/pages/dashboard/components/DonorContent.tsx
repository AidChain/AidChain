import React, { useState } from 'react';
import UserProfileCard from "@/components/UserProfileCard";
import Snackbar from "@/components/Snackbar";
import RecipientCard from '@/components/RecipientCard';

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

    const recipients = [
      {
        id: "rec1",
        recipient: "Test Recipient Name",
        image: "https://picsum.photos/200"
      },
      {
        id: "rec2",
        recipient: "Test Recipient Name",
        image: "https://picsum.photos/200"
      },
      {
        id: "rec3",
        recipient: "Test Recipient Name",
        image: "https://picsum.photos/200"
      },
      {
        id: "rec4",
        recipient: "Test Recipient Name",
        image: "https://picsum.photos/200"
      },
      {
        id: "rec5",
        recipient: "Test Recipient Name",
        image: "https://picsum.photos/200"
      },
      {
        id: "rec6",
        recipient: "Test Recipient Name",
        image: "https://picsum.photos/200"
      }
    ]

  return (
    <>
      <div className="flex flex-col pt-8 mb-8 pr-8 h-full w-full gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-3xl sm:text-4xl font-semibold">Welcome back, 
          <span className="text-transparent bg-gradient-to-r from-teal-200 to-blue-500 bg-clip-text"> {username}</span>
          .</h2>
          <p className="text-md sm:text-lg text-slate-300">
            Your transparent donation platform dashboard.
          </p>
        </div>
        <div className="flex flex-row gap-8 h-full w-full">
          <div className="flex flex-2 flex-col h-full gap-6">
            <UserProfileCard onShowSnackbar={showSnackbar} />
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              <h3 className="text-white text-xl sm:text-2xl font-medium">Quick Donate</h3>
              <div className="flex-1 overflow-hidden">
                <ul className="h-full overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
                  {
                    recipients.map((item, index) => (
                      <li key={item.id}>
                        <RecipientCard 
                          id={item.id}
                          recipient={item.recipient}
                          image={item.image}
                        />
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-3 flex-col bg-blue-400 h-inherit"></div>
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
      </div>
    </>
  );
};