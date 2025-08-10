'use client'

import Image from 'next/image';
import logo_white from '@/assets/logo-white.svg'
import { useState } from 'react';
import { EyeOutlined, CopyOutlined } from '@ant-design/icons';

interface CreditCardProps {
  onShowSnackbar?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function CreditCard({ onShowSnackbar }: CreditCardProps) {
  const [showCardDetails, setshowCardDetails] = useState(false);

  const cardDetails = {
    cardNumber: "1234 5678 9101 1121",
    validThru: "6/26",
    cvc: "999"
  }

  const copyToClipboard = async () => {
    if (!cardDetails.cardNumber) return;
    
    try {
      await navigator.clipboard.writeText(cardDetails.cardNumber);
      // Show success snackbar
      if (onShowSnackbar) {
        onShowSnackbar("Card number copied to clipboard", "success");
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      // Show error snackbar
      if (onShowSnackbar) {
        onShowSnackbar("Failed to copy card number", "error");
      }
    }
  };

  return (
    <>
      <div className="w-full mx-auto">
        {/* Frosted Glass Card */}
        <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-6 hover:shadow-xl
        hover:shadow-blue-700/50 transition-all duration-300 ease-in-out">
          {/* Gradient overlay for extra glass effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/80 to-teal-300/80 rounded-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col gap-8">
              <div className="flex justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                    <Image src={logo_white} alt="logo" width={80} />
                  </div>
                  <span className="text-white font-medium text-xl sm:text-3xl tracking-widest">AIDCHAIN</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className={`flex cursor-pointer ${showCardDetails ? '' : 'bottom-4'} p-2 md:p-4 rounded-full hover:bg-white/10 justify-center items-center`}
                    onClick={() => {setshowCardDetails(!showCardDetails)}}
                  >
                    <EyeOutlined style={{ fontSize: '18px' }} />
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex cursor-pointer p-2 md:p-4 hover:bg-white/10 rounded-full transition-colors duration-200"
                    title="Copy full address"
                  >
                    <CopyOutlined 
                      style={{ fontSize: '18px' }}
                    />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className='flex flex-col gap-1'>
                  <p className='text-sm text-slate-300'>CARD NUMBER</p>
                  <h3 className="text-2xl">
                    {showCardDetails ? cardDetails.cardNumber : "**** **** **** ****"}
                  </h3>
                </div>
                <div  className='flex w-full'>
                  <div className='flex flex-1 flex-col gap-1'>
                    <p className='text-sm text-slate-300'>VALID UNTIL</p>
                    <h3 className="text-2xl">
                      {showCardDetails ? cardDetails.validThru : "**/**"}
                    </h3>
                  </div>
                  <div className='flex flex-1 flex-col gap-1'>
                    <p className='text-sm text-slate-300'>CVC</p>
                    <h3 className="text-2xl">
                      {showCardDetails ? cardDetails.cvc : "***"}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}