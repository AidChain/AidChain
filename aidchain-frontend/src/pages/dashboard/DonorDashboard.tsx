'use client'

import React, { useState } from 'react';
import SideMenu from '@/components/SideMenu';

export default function DonorDashboard() {
  const [activeTab, setActiveTab] = useState<string>('donor');
  
  const handleTabChange = (tabId: string): void => {
    setActiveTab(tabId);
  };

  return (
    <div className="h-screen bg-gradient-to-t from-black to-blue-950 text-white relative overflow-hidden">
      <SideMenu 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
    </div>
  );
}