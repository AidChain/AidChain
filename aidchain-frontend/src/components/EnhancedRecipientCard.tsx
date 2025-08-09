'use client'

import { useState } from 'react';
import Image from 'next/image';
import Modal from '@/components/Modal';
import GradientBorderButton from '@/components/GradientBorderButton';
import { DonationCardData } from '@/lib/donation-card-service';
import { useZkLogin } from '@/providers/ZkLoginProvider';

interface EnhancedRecipientCardProps {
  card: DonationCardData;
  onDonationSuccess?: () => void;
}

export default function EnhancedRecipientCard({ 
  card, 
  onDonationSuccess 
}: EnhancedRecipientCardProps) {
  const { userAddress, signPersonalMessage } = useZkLogin();
  const [showModal, setShowModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState<string>('1.0');
  const [donationMessage, setDonationMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDonate = async () => {
    if (!userAddress) {
      alert('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(donationAmount);
    if (amount < 0.5) {
      alert('Minimum donation is 0.5 SUI');
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Create sponsored transaction
      const sponsorResponse = await fetch('/api/transactions/sponsored-donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorAddress: userAddress,
          cardId: card.id,
          amount: amount,
          message: donationMessage || null
        })
      });

      const sponsorResult = await sponsorResponse.json();
      if (!sponsorResult.success) {
        throw new Error(sponsorResult.error || 'Failed to create sponsored transaction');
      }

      // Step 2: Sign the transaction
      const txBytes = Uint8Array.from(Buffer.from(sponsorResult.txBytes, 'base64'));
      const { signature } = await signPersonalMessage(txBytes);

      // Step 3: Execute sponsored transaction
      const executeResponse = await fetch('/api/transactions/execute-sponsored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          digest: sponsorResult.digest,
          signature: signature
        })
      });

      const executeResult = await executeResponse.json();
      if (!executeResult.success) {
        throw new Error(executeResult.error || 'Failed to execute sponsored transaction');
      }

      // Success!
      alert(`✅ Successfully donated ${amount} SUI to ${card.target_name}!`);
      setShowModal(false);
      setDonationAmount('1.0');
      setDonationMessage('');
      
      if (onDonationSuccess) {
        onDonationSuccess();
      }

    } catch (error) {
      console.error('Donation failed:', error);
      alert(`❌ Donation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Use Walrus image if available, otherwise fallback
  const cardImage = card.image_blob_id 
    ? `/api/walrus/blob/${card.image_blob_id}` 
    : `https://picsum.photos/200/200?random=${card.id}`;

  return (
    <>
      <div className="w-full mx-auto">
        <div 
          className="cursor-pointer relative bg-white/10 backdrop-blur-lg border border-blue-400/40 rounded-2xl px-6 py-4 hover:shadow-md hover:shadow-blue-700/50 transition-all duration-300 ease-in-out" 
          onClick={() => setShowModal(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent rounded-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-20 rounded-full overflow-hidden border-2 border-white/30">
                  <Image
                    src={cardImage}
                    alt={card.target_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="truncate w-48 text-white/90 text-md md:text-lg font-mono px-3 py-1 rounded-lg">
                    {card.target_name}
                  </span>
                  <span className="text-xs text-white/60 px-3">
                    {card.raised_formatted} raised
                  </span>
                </div>
              </div>
              
              {/* Progress indicator */}
              {card.goal_amount > 0 && (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-white/70 mb-1">
                    {card.progress_percentage.toFixed(1)}%
                  </span>
                  <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(card.progress_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>  
        </div>
      </div>

      <Modal
        header={card.target_name}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <div className='w-[80vw] md:w-[40vw]'>
          <div className="mb-4">
            <Image
              src={cardImage}
              alt={card.target_name}
              width={400}
              height={200}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
          
          <p className='text-left text-slate-300 mb-6'>{card.description}</p>
          
          {/* Progress Bar */}
          {card.goal_amount > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/70">Progress</span>
                <span className="text-sm text-white/70">
                  {card.raised_formatted} / {card.goal_formatted}
                </span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min(card.progress_percentage, 100)}%` }}
                />
              </div>
              <div className="text-center mt-2">
                <span className="text-lg font-semibold text-white">
                  {card.progress_percentage.toFixed(1)}% Complete
                </span>
              </div>
            </div>
          )}

          {/* Donation Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Donation Amount (SUI)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.1"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                placeholder="Minimum 0.5 SUI"
              />
              <p className="text-xs text-white/60 mt-1">
                Minimum donation: 0.5 SUI (no fees for you!)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 resize-none"
                placeholder="Leave a message of support..."
                rows={3}
              />
            </div>
          </div>
          
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
            >
              Cancel
            </button>
            <GradientBorderButton
              onClick={handleDonate}
              size="md"
              disabled={isLoading || !userAddress || parseFloat(donationAmount) < 0.5}
            >
              {isLoading ? 'Processing...' : `Donate ${donationAmount} SUI`}
            </GradientBorderButton>
          </div>
          
          {/* Sponsored Transaction Info */}
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              🎉 <strong>Gas-Free Donation:</strong> Your transaction fees are sponsored by AidChain!
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}