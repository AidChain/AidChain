'use client'

import React, { useState } from 'react';
import SideMenu from '@/components/SideMenu';
import DonorContent from './components/DonorContent';
import RecipientContent from './components/RecipientContent';
import { ZkLoginProvider } from '@/providers/ZkLoginProvider';
import { WalletProvider } from '@mysten/dapp-kit';

export default function NewDashboard() {
  const [activeTab, setActiveTab] = useState<string>('donor');
  
  const handleTabChange = (tabId: string): void => {
    setActiveTab(tabId);
  };

  return (
    <WalletProvider>
      <ZkLoginProvider>
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
      </ZkLoginProvider>
    </WalletProvider>
  );
}