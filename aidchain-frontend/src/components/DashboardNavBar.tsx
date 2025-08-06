'use client'

import logo from '@/assets/logo.svg';
import Image from 'next/image';
import { WalletButton } from './WalletButton';
import { useRouter } from 'next/navigation';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import { useState, useRef, useEffect } from 'react';
import { DownOutlined, GithubOutlined } from '@ant-design/icons';

export default function DashboardNavBar() {
  const router = useRouter();
  const { isAuthenticated } = useZkLogin();
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDocDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const handleDonateClick = () => {
    // TODO: Navigate to donation page when implemented
    console.log('Navigate to donation page');
  };

  const handleRecipientClick = () => {
    // TODO: Navigate to recipient page when implemented
    console.log('Navigate to recipient page');
  };

  const handleGitHubClick = () => {
    window.open('https://github.com/AidChain', '_blank');
  };

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[80vw]">
      <div className="bg-black/10 backdrop-blur-md border border-white/20 rounded-full px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-8">
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <Image src={logo} alt="logo" width={80} />
              </div>
              <span className="text-white font-medium text-xl sm:text-2xl tracking-widest">AIDCHAIN</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden items-center space-x-8 lg:flex">
              <button 
                onClick={handleDonateClick}
                className="text-slate-300 hover:text-white hover:cursor-pointer transition-colors duration-200 font-medium text-lg"
              >
                Donate
              </button>
              <button 
                onClick={handleRecipientClick}
                className="text-slate-300 hover:text-white hover:cursor-pointer transition-colors duration-200 font-medium text-lg"
              >
                Recipient
              </button>
              
              {/* Documentation Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDocDropdownOpen(!isDocDropdownOpen)}
                  className="flex items-center space-x-1 text-slate-300 hover:text-white hover:cursor-pointer transition-colors duration-200 font-medium text-lg"
                >
                  <span>Documentation</span>
                  <DownOutlined 
                    className={`transition-transform duration-200 ${isDocDropdownOpen ? 'rotate-180' : ''}`}
                    style={{ fontSize: '14px' }}
                  />
                </button>
                
                {/* Dropdown Menu */}
                {isDocDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg py-2 min-w-[200px]">
                    <button
                      onClick={handleGitHubClick}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      <GithubOutlined style={{ fontSize: '18px' }} />
                      <span>GitHub</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Button */}
          <WalletButton variant="login" size='sm'/>
        </div>
      </div>
    </nav>
  );
}