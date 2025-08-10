'use client'

import React, { useState } from 'react';
import SideMenu from '@/components/SideMenu';
import DonorContent from './components/DonorContent';
import RecipientContent from './components/RecipientContent';
import Providers from '@/providers/Providers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function NewDashboard() {
  const [activeTab, setActiveTab] = useState<string>('donor');

  // Create QueryClient instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 3,
      },
    },
  }));
  
  const handleTabChange = (tabId: string): void => {
    setActiveTab(tabId);
  };

  return (
    <Providers>
      <div className="h-auto lg:h-screen w-screen flex gap-8 bg-gradient-to-t from-black to-blue-950 text-white relative overflow-hidden">
        <SideMenu 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        {activeTab == 'donor' ? 
          <DonorContent /> :
          <RecipientContent />
        }
      </div>
    </Providers>
  );
}