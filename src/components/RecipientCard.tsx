import Image from 'next/image';
import Modal from './Modal';
import GradientBorderButton from './GradientBorderButton';
import { useState } from 'react';

interface RecipientCardProps {
  recipient: string;
  description?: string;
  image?: string;
}

export default function RecipientCard({
    recipient = "Test Recipient Name",
    description = "Test description",
    image = "https://picsum.photos/200"
  }:RecipientCardProps) {

  const [showRecipientModal, setShowRecipientModal] = useState(false);
    
  return (
    <>
      <div className="w-full mx-auto">
        {/* Frosted Glass Card */}
        <div className="cursor-pointer relative bg-white/10 backdrop-blur-lg border border-blue-400/40 rounded-2xl px-6 py-4 hover:shadow-md
        hover:shadow-blue-700/50 transition-all duration-300 ease-in-out" onClick={() => setShowRecipientModal(true)}>
          {/* Gradient overlay for extra glass effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent rounded-2xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Profile Section */}
            <div className="flex items-center justify-between w-full">
              {/* Profile Picture */}
              <div className="flex items-center gap-2">
                <div className="w-20 rounded-full overflow-hidden border-2 border-white/30">
                  <Image
                    src={image}
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="truncate w-48 text-white/90 text-md md:text-lg font-mono px-3 py-1 rounded-lg">
                    {recipient}
                </span>
                </div>
              </div>
            </div>
          </div>  
        </div>
        <Modal
          header = {recipient}
          isOpen = {showRecipientModal}
          onClose={() => setShowRecipientModal(false)}
        >
          <div className='w-[80vw] md:w-[40vw]'>
            <p className='text-left text-slate-300 mb-8'>{description}</p>
            <div className='flex justify-end'>
              <GradientBorderButton
                onClick={() => {}}
                size="md"
              >
                Donate Now
              </GradientBorderButton>
            </div>
          </div>
        </Modal>
    </>
  );
}