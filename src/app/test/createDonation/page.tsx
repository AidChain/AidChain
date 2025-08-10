'use client'

import { useState } from 'react';
import { createDonationCardTransaction, executeTransactionAsAdmin, getAdminAddress } from '@/lib/sui-transactions';

interface DonationCardInput {
  title: string;
  targetName: string;
  description: string;
  targetAddress: string | null;
  imageBlobId: string | null;
  galleryImages: string[] | null;
  totalRaised?: number;
  goalAmount: number; // in SUI
}

interface UploadResult {
  blobId?: string;
  error?: string;
}

const defaultCards: DonationCardInput[] = [
  {
    title: "Support Education in Kenya",
    targetName: "Seeds of Hope Foundation",
    description: "Based in rural Kenya, Seeds of Hope provides food, clean water, and school supplies to orphaned children and single-mother households. Donations help fund weekly care packages and tuition aid.",
    targetAddress: null,
    imageBlobId: null,
    galleryImages: null,
    totalRaised: 300,
    goalAmount: 1000
  },
  {
    title: "Emergency Medical Aid for Refugees",
    targetName: "Amaan Refugee Network", 
    description: "Operating across Syrian and Palestinian refugee camps in Jordan, Amaan coordinates essential medical support, baby formula, and emergency aid to families who lack access to stable housing or income.",
    targetAddress: null,
    imageBlobId: null,
    galleryImages: null,
    totalRaised: 1200,
    goalAmount: 2000
  },
  {
    title: "Women's Safety and Empowerment",
    targetName: "Bayanihan Women's Shelter",
    description: "Located in the Philippines, Bayanihan offers safe housing, meals, and skills training to women escaping domestic abuse. Donations cover essentials like hygiene kits, food, and trauma counseling services.",
    targetAddress: null,
    imageBlobId: null,
    galleryImages: null,
    totalRaised: 1100,
    goalAmount: 1500
  },
  {
    title: "Indigenous Community Support",
    targetName: "Northern Highlands Indigenous Support Trust",
    description: "Serving indigenous Quechua communities in Peru, this trust focuses on providing winter clothing, solar lanterns, and access to telehealth services for elders and children in remote villages.",
    targetAddress: null,
    imageBlobId: null,
    galleryImages: null,
    totalRaised: 650,
    goalAmount: 800
  }
];

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<boolean[]>(
    new Array(defaultCards.length).fill(true)
  );
  
  // ✅ Image upload states
  const [cardImages, setCardImages] = useState<{ [index: number]: File | null }>({});
  const [uploadingImages, setUploadingImages] = useState<{ [index: number]: boolean }>({});
  const [uploadedBlobIds, setUploadedBlobIds] = useState<{ [index: number]: string }>({});
  const [imagePreviewUrls, setImagePreviewUrls] = useState<{ [index: number]: string }>({});

  // ✅ Handle image file selection
  const handleImageSelect = (cardIndex: number, file: File | null) => {
    setCardImages(prev => ({ ...prev, [cardIndex]: file }));
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrls(prev => ({ ...prev, [cardIndex]: previewUrl }));
    } else {
      if (imagePreviewUrls[cardIndex]) {
        URL.revokeObjectURL(imagePreviewUrls[cardIndex]);
      }
      setImagePreviewUrls(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[cardIndex];
        return newPreviews;
      });
      setUploadedBlobIds(prev => {
        const newBlobIds = { ...prev };
        delete newBlobIds[cardIndex];
        return newBlobIds;
      });
    }
  };

  // ✅ Upload image to Walrus
  const uploadImageToWalrus = async (cardIndex: number): Promise<string | null> => {
    const file = cardImages[cardIndex];
    if (!file) return null;

    setUploadingImages(prev => ({ ...prev, [cardIndex]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('epochs', '10');

      const response = await fetch('/api/walrus/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const blobId = data.data.newlyCreated?.blobObject.blobId || data.data.alreadyCertified?.blobId;
        setUploadedBlobIds(prev => ({ ...prev, [cardIndex]: blobId }));
        return blobId;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    } finally {
      setUploadingImages(prev => ({ ...prev, [cardIndex]: false }));
    }
  };

  const createAllCards = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      const selectedCardData = defaultCards.filter((_, index) => selectedCards[index]);
      const selectedIndices = selectedCards.map((selected, index) => selected ? index : -1).filter(i => i !== -1);
      
      for (let i = 0; i < selectedCardData.length; i++) {
        const card = selectedCardData[i];
        const originalIndex = selectedIndices[i];
        
        try {
          console.log(`🔍 Creating card ${i + 1}/${selectedCardData.length}: ${card.title}`);
          
          // ✅ Upload image first if selected
          let imageBlobId: string | null = null;
          if (cardImages[originalIndex]) {
            setResults(prev => [...prev, `📸 Uploading image for "${card.title}"...`]);
            imageBlobId = await uploadImageToWalrus(originalIndex);
            
            if (imageBlobId) {
              setResults(prev => [...prev, `✅ Image uploaded for "${card.title}" - Blob ID: ${imageBlobId}`]);
            } else {
              setResults(prev => [...prev, `⚠️ Image upload failed for "${card.title}" - proceeding without image`]);
            }
          }
          
          // ✅ Create donation card (totalRaised is just passed for tracking, not funding)
          const tx = await createDonationCardTransaction(
            card.title,
            card.description,
            card.targetAddress,
            card.targetName,
            imageBlobId, // Use uploaded blob ID
            card.galleryImages,
            card.totalRaised || 0, // ✅ Just for tracking purposes
            card.goalAmount
          );
          
          const result = await executeTransactionAsAdmin(tx);
          
          setResults(prev => [...prev, 
            `✅ Created "${card.title}" - Digest: ${result.digest} ${card.totalRaised ? `(Initial: ${card.totalRaised} SUI tracked)` : ''}`
          ]);
          
          // Small delay between transactions
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Failed to create card: ${card.title}`, error);
          setResults(prev => [...prev, 
            `❌ Failed to create "${card.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
          ]);
        }
      }
      
    } catch (error) {
      console.error('Failed to create donation cards:', error);
      setResults(prev => [...prev, 
        `❌ General error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCard = (index: number) => {
    setSelectedCards(prev => {
      const newSelected = [...prev];
      newSelected[index] = !newSelected[index];
      return newSelected;
    });
  };

  const toggleAll = () => {
    const allSelected = selectedCards.every(selected => selected);
    setSelectedCards(new Array(defaultCards.length).fill(!allSelected));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            🏗️ Test: Create Donation Cards
          </h1>
          
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <h2 className="text-blue-400 font-semibold mb-2">🔑 Admin Setup</h2>
            <p className="text-blue-300 text-sm">
              Admin Address: {getAdminAddress()}
            </p>
            <p className="text-blue-300 text-sm">
              Package ID: {process.env.NEXT_PUBLIC_DONATION_POOL_PACKAGE_ID}
            </p>
            <p className="text-blue-300 text-sm">
              Admin Cap: {process.env.NEXT_PUBLIC_ADMIN_CAP_OBJECT}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Select Cards to Create ({selectedCards.filter(Boolean).length}/{defaultCards.length})
              </h2>
              <button
                onClick={toggleAll}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                {selectedCards.every(selected => selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-4">
              {defaultCards.map((card, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-lg transition-all ${
                    selectedCards[index] 
                      ? 'bg-green-500/20 border-green-500/50' 
                      : 'bg-gray-500/20 border-gray-500/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedCards[index]}
                      onChange={() => toggleCard(index)}
                      className="w-4 h-4 mt-1"
                    />
                    
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{card.title}</h3>
                      <p className="text-white/70 text-sm">{card.targetName}</p>
                      <div className="flex gap-4 text-xs mt-1">
                        <p className="text-green-400">Initial: {card.totalRaised || 0} SUI</p>
                        <p className="text-blue-400">Goal: {card.goalAmount} SUI</p>
                      </div>
                      
                      {/* ✅ Image Upload Section */}
                      <div className="mt-3 space-y-2">
                        <label className="block text-sm text-white/80">
                          Card Image (Optional):
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(index, e.target.files?.[0] || null)}
                          className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                        />
                        
                        {/* Image Preview */}
                        {imagePreviewUrls[index] && (
                          <div className="mt-2">
                            <img 
                              src={imagePreviewUrls[index]} 
                              alt={`Preview for ${card.title}`}
                              className="w-24 h-24 object-cover rounded-lg border border-white/20"
                            />
                          </div>
                        )}
                        
                        {/* Upload Status */}
                        {uploadingImages[index] && (
                          <p className="text-yellow-400 text-xs">📤 Uploading image...</p>
                        )}
                        {uploadedBlobIds[index] && (
                          <p className="text-green-400 text-xs">✅ Image uploaded: {uploadedBlobIds[index].substring(0, 8)}...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={createAllCards}
            disabled={isLoading || selectedCards.filter(Boolean).length === 0}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? '🔄 Creating Cards...' 
              : `🚀 Create ${selectedCards.filter(Boolean).length} Donation Cards`
            }
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">📋 Results</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      result.startsWith('✅') 
                        ? 'bg-green-500/20 text-green-300'
                        : result.startsWith('📸') || result.startsWith('⚠️')
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : result.startsWith('❌')
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <h3 className="text-yellow-400 font-semibold mb-2">📝 Instructions</h3>
            <ol className="text-yellow-300 text-sm space-y-1">
              <li>1. Select which donation cards you want to create</li>
              <li>2. Optionally upload images for each card (stored on Walrus)</li>
              <li>3. Click "Create Donation Cards" to upload to smart contract</li>
              <li>4. Initial amounts are just for tracking/display purposes</li>
              <li>5. Check the results section for transaction digests</li>
              <li>6. Go back to the main dashboard to see the new cards!</li>
            </ol>
          </div>

          {/* Navigation */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <a 
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}