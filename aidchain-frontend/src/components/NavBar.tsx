'use client'

import logo from '@/assets/logo.svg';
import Image from 'next/image';
import { WalletButton } from './WalletButton';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    // Check if we're on the landing page
    if (window.location.pathname === '/') {
      // If on landing page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    } else {
      // If on another page (like dashboard), redirect to landing page with section
      router.push(`/#${sectionId}`);
    }
  };

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[80vw]">
      <div className="bg-black/10 backdrop-blur-md border border-white/20 rounded-full px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <Image src={logo} alt="logo" width={80} />
              </div>
              <span className="hidden sm:flex text-white font-medium text-xl sm:text-2xl tracking-widest">AIDCHAIN</span>
            </div>
            <div className="hidden items-center space-x-8 lg:flex">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-slate-300 hover:text-white hover:cursor-pointer transition-colors duration-200 font-medium text-lg"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('aidchain-in-action')}
                className="text-slate-300 hover:text-white hover:cursor-pointer transition-colors duration-200 font-medium text-lg"
              >
                AidChain in Action
              </button>
              <button 
                onClick={() => scrollToSection('why-aidchain')}
                className="text-slate-300 hover:text-white hover:cursor-pointer transition-colors duration-200 font-medium text-lg"
              >
                Why AidChain?
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-slate-300 hover:text-white hover:cursor-pointer transition-colors duration-200 font-medium text-lg"
              >
                How It Works
              </button>
            </div>
          </div>
          <WalletButton variant="login" size='sm'/>
        </div>
      </div>
    </nav>
  );
}