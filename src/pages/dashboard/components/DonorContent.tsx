import React, { useState, useEffect, useRef } from 'react';
import UserProfileCard from "@/components/UserProfileCard";
import Snackbar from "@/components/Snackbar";
import EnhancedRecipientCard from '@/components/EnhancedRecipientCard';
import Modal from '@/components/Modal';
import * as Chart from 'chart.js';
import { ChevronDown } from 'lucide-react';
import GradientBorderButton from '@/components/GradientBorderButton';
import { donationCardService, DonationCardData } from '@/lib/donation-card-service';

// Register Chart.js components
Chart.Chart.register(
  Chart.CategoryScale,
  Chart.LinearScale,
  Chart.LineController,
  Chart.PointElement,
  Chart.LineElement,
  Chart.Title,
  Chart.Tooltip,
  Chart.Legend
);

// ✅ Fixed Walrus Image cache interface
interface WalrusImageCache {
  [blobId: string]: {
    url: string;
    timestamp: number;
  };
}

export default function DonorContent() {
  const username = "Test User";
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart.Chart | null>(null);
  
  const [selectedRecipient, setSelectedRecipient] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [donationCards, setDonationCards] = useState<DonationCardData[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  
  // ✅ Fixed image cache state
  const [walrusImageCache, setWalrusImageCache] = useState<WalrusImageCache>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

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

  // ✅ Enhanced donation data with dynamic mapping
  const getDonationData = () => {
    // Base donation data template
    const baseDonationData: { [key: string]: { labels: string[]; data: number[]; color: string; } } = {
      all: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        data: [1200, 1500, 900, 2100, 1800, 2400, 2800, 2200, 1900, 2600, 3100, 2900],
        color: 'rgba(59, 130, 246, 1)'
      }
    };

    // Mock data patterns for different cards
    const mockDataPatterns = [
      [300, 400, 200, 600, 500, 700, 800, 600, 500, 700, 900, 800], // Pattern 1
      [200, 350, 150, 450, 400, 550, 650, 500, 400, 600, 750, 700], // Pattern 2
      [400, 450, 300, 550, 500, 650, 750, 600, 550, 700, 800, 750], // Pattern 3
      [300, 300, 250, 500, 400, 500, 600, 500, 450, 600, 650, 650], // Pattern 4
    ];

    // ✅ Dynamically create data for each donation card
    const dynamicData = { ...baseDonationData };
    
    donationCards.forEach((card, index) => {
      const patternIndex = index % mockDataPatterns.length;
      dynamicData[card.id] = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        data: mockDataPatterns[patternIndex],
        color: 'rgba(59, 130, 246, 1)'
      };
    });

    return dynamicData;
  };

  // ✅ Enhanced transaction data that matches donation cards
  const getTransactionData = () => {
    const transactions = [
      { recipient: "Seeds of Hope Foundation", amount: 500 },
      { recipient: "Seeds of Hope Foundation", amount: 300 },
      { recipient: "Bayanihan Women's Shelter", amount: 350 },
      { recipient: "Northern Highlands Indigenous Support Trust", amount: 50 },
      { recipient: "Bayanihan Women's Shelter", amount: 400 },
      { recipient: "Amaan Refugee Network", amount: 100 },
      { recipient: "Northern Highlands Indigenous Support Trust", amount: 200 },
    ];

    // ✅ If we have real donation cards, add some mock transactions for them
    if (donationCards.length > 0) {
      const additionalTransactions = donationCards.flatMap(card => [
        { recipient: card.target_name, amount: Math.floor(Math.random() * 500) + 50 },
        { recipient: card.target_name, amount: Math.floor(Math.random() * 300) + 100 },
      ]);
      
      return [...transactions, ...additionalTransactions].slice(-10); // Keep last 10 transactions
    }

    return transactions;
  };

  // ✅ Fixed Walrus image fetching function
  const fetchWalrusImage = async (blobId: string): Promise<string | null> => {
    // Check cache first
    if (walrusImageCache[blobId]) {
      return walrusImageCache[blobId].url;
    }

    if (loadingImages.has(blobId)) {
      return null; // Already loading
    }

    setLoadingImages(prev => new Set(prev).add(blobId));

    try {
      console.log(`🖼️ Fetching Walrus image: ${blobId}`);
      
      // ✅ Updated API endpoint to match your structure
      const response = await fetch(`/api/walrus/blob/${blobId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ✅ Get the blob from response
      const blob = await response.blob();
      
      // ✅ Create object URL
      const objectUrl = URL.createObjectURL(blob);
      
      // ✅ Cache the object URL with timestamp
      setWalrusImageCache(prev => ({
        ...prev,
        [blobId]: {
          url: objectUrl,
          timestamp: Date.now()
        }
      }));
      
      console.log(`✅ Successfully loaded Walrus image: ${blobId}`);
      return objectUrl;
      
    } catch (error) {
      console.error(`❌ Failed to fetch Walrus image ${blobId}:`, error);
      return null;
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(blobId);
        return newSet;
      });
    }
  };

  // ✅ Enhanced function to fetch donation cards and their images
  const fetchDonationCards = async () => {
    try {
      setIsLoadingCards(true);
      const cards = await donationCardService.fetchAllDonationCards();
      setDonationCards(cards);
      
      // ✅ Fetch images for cards that have them
      const cardsWithImages = cards.filter(card => card.image_blob_id);
      if (cardsWithImages.length > 0) {
        console.log(`🖼️ Loading ${cardsWithImages.length} card images from Walrus...`);
        
        // Fetch images concurrently
        cardsWithImages.forEach(async (card) => {
          if (card.image_blob_id) {
            await fetchWalrusImage(card.image_blob_id);
          }
        });
      }
      
      console.log('✅ Fetched donation cards:', cards.length);
    } catch (error) {
      console.error('Failed to fetch donation cards:', error);
      showSnackbar('Failed to load donation cards', 'error');
    } finally {
      setIsLoadingCards(false);
    }
  };

  // Fetch cards on component mount
  useEffect(() => {
    fetchDonationCards();
  }, []);

  // ✅ Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(walrusImageCache).forEach(cached => {
        URL.revokeObjectURL(cached.url);
      });
    };
  }, []);

  // Handle donation success - refresh cards
  const handleDonationSuccess = () => {
    showSnackbar('Donation successful! Thank you for your contribution! 🎉', 'success');
    fetchDonationCards(); // Refresh to show updated amounts
  };

  // ✅ Enhanced recipient card component with fixed Walrus image support
  const RecipientCardWithWalrusImage = ({ card }: { card: DonationCardData }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
      if (card.image_blob_id) {
        if (walrusImageCache[card.image_blob_id]) {
          setImageUrl(walrusImageCache[card.image_blob_id].url);
        } else if (!loadingImages.has(card.image_blob_id)) {
          setImageLoading(true);
          setImageError(false);
          
          fetchWalrusImage(card.image_blob_id)
            .then(url => {
              if (url) {
                setImageUrl(url);
              } else {
                setImageError(true);
              }
            })
            .catch(() => {
              setImageError(true);
            })
            .finally(() => {
              setImageLoading(false);
            });
        }
      }
    }, [card.image_blob_id, walrusImageCache]);

    return (
      <EnhancedRecipientCard 
        card={{
          ...card,
          // ✅ Use Walrus image if available, fallback to placeholder, or show error state
          imageUrl: imageUrl || (imageError ? '' : `https://picsum.photos/200/200?random=${card.id}`),
          imageLoading: imageLoading
        }}
        onDonationSuccess={handleDonationSuccess}
      />
    );
  };

  // ✅ Get dynamic donation data based on current cards
  const donationData = getDonationData();
  const transactionData = getTransactionData();

  // ✅ Calculate total from graph data instead of card sum
  const getTotalFromGraphData = () => {
    const currentData = donationData[selectedRecipient] || donationData.all;
    return currentData.data.reduce((sum, value) => sum + value, 0);
  };

  // Create filter options from actual donation cards
  const filterOptions = [
    { value: 'all', label: 'All Recipients' },
    ...donationCards.map(card => ({ value: card.id, label: card.target_name }))
  ];

  // ✅ Chart effect with dynamic data
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d') as CanvasRenderingContext2D;
      if (!ctx) return; // Early return if context is null
      
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const currentData = donationData[selectedRecipient] || donationData.all;
      
      chartInstance.current = new Chart.Chart(ctx, {
        type: 'line',
        data: {
          labels: currentData.labels,
          datasets: [{
            label: 'Donations (SUI)',
            data: currentData.data,
            borderColor: currentData.color,
            backgroundColor: currentData.color.replace('1)', '0.1)'),
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: currentData.color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: currentData.color,
              borderWidth: 1,
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  return `${context.parsed.y.toLocaleString()} SUI`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(75, 85, 99, 0.3)',
              },
              ticks: {
                color: '#9CA3AF',
                callback: function(value) {
                  return value.toLocaleString() + ' SUI';
                }
              }
            },
            x: {
              grid: {
                color: 'rgba(75, 85, 99, 0.3)',
              },
              ticks: {
                color: '#9CA3AF'
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [selectedRecipient, donationCards]);

  const selectedOption = filterOptions.find(option => option.value === selectedRecipient);

  return (
    <>
      <div className="flex flex-col pl-8 md:pl-0 pt-8 pb-8 pr-8 h-full w-full gap-8 md:ml-72 md:overflow-x-scroll mb-24 md:mb-0">
        <div className="flex flex-col gap-2 flex-shrink-0">
          <h2 className="text-white text-3xl sm:text-4xl font-semibold">Welcome back, 
          <span className="text-transparent bg-gradient-to-r from-teal-200 to-blue-500 bg-clip-text"> {username}</span>
          .</h2>
          <p className="text-md sm:text-lg text-slate-300">
            Your transparent donation platform dashboard.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          <div className="flex flex-2 flex-col h-full gap-6">
            <div className="flex-shrink-0">
              <UserProfileCard onShowSnackbar={showSnackbar} />
            </div>
            
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              <div className='flex justify-between items-center'>
                <h3 className="text-white text-xl sm:text-2xl font-medium flex-shrink-0">
                  Quick Donate {donationCards.length > 0 && `(${donationCards.length})`}
                </h3>
                <button 
                  onClick={fetchDonationCards}
                  className='text-sm text-slate-400 hover:text-white transition-colors'
                  disabled={isLoadingCards}
                >
                  {isLoadingCards ? 'LOADING...' : 'REFRESH'}
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                {isLoadingCards ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-white/60">Loading donation cards from blockchain...</div>
                  </div>
                ) : donationCards.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-white/60">No donation cards available</div>
                  </div>
                ) : (
                  <ul className="h-full w-full overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30 pb-2">
                    {donationCards.map((card) => (
                      <li key={card.id}>
                        <RecipientCardWithWalrusImage card={card} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-3 flex-col">
            <div className="flex min-h-full w-full bg-gray-800/50 backdrop-blur-lg border border-blue-400/40 rounded-xl p-6 flex flex-col hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 ease-in-out">
                {/* Chart Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-xl sm:text-2xl font-medium mb-1">Donation History</h3>
                  
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors w-[160px] truncate justify-between"
                    >
                      <span className="truncate">{selectedOption?.label || 'All Recipients'}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-gray-600 rounded-lg shadow-lg z-20 w-[160px]">
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedRecipient(option.value);
                              setIsDropdownOpen(false);
                            }}
                            className={`cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                              selectedRecipient === option.value ? 'bg-gray-700 text-blue-400' : 'text-white'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Chart Container */}
                <div className="relative h-full">
                  <canvas ref={chartRef} className="h-full w-full"></canvas>
                </div>
                
                {/* Stats Summary */}
                <div className="mt-4 pt-4 border-t border-gray-700 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-gray-400 text-sm">Total Graph Donations</p>
                      <p className="text-white text-lg font-semibold">
                        {/* ✅ Issue 3 Fixed: Use graph data instead of card sum */}
                        {getTotalFromGraphData().toLocaleString()} SUI
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Active Cards</p>
                      <p className="text-white text-lg font-semibold">
                        {donationCards.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Gas Fees Saved</p>
                      <p className="text-white text-lg font-semibold">
                        100% 🎉
                      </p>
                    </div>
                  </div>
                </div>
                <GradientBorderButton
                  onClick={() => {setShowTransactionModal(true)}}
                  size="sm"
                >
                  View Transaction History
                </GradientBorderButton>
              </div>
          </div>
        </div>

        {/* Snackbar Container - Fixed Bottom Right */}
        <div className="fixed bottom-20 md:bottom-4 right-48 z-50 space-y-2">
          {snackbars.map((snackbar, index) => (
            <div
              key={snackbar.id}
              style={{
                transform: `translateY(${index * -70}px)`
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
      
      <Modal
        header="Transaction History"
        isOpen={showTransactionModal}
        onClose={() => {setShowTransactionModal(false)}}
      >
        <ul className='w-[80vw] md:w-[40vw] flex flex-col overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30'>
          {transactionData.map((item, index) => 
            <li key={index} className="relative z-10">
              <div className="flex items-center justify-between w-full bg-white/10 border border-slate-300/10 rounded-lg px-3 py-4 gap-4">
                <p className="text-left text-white/90 text-md md:text-lg max-w-[80%]">
                    {item.recipient}
                </p>
                <p className="text-red-300 text-sm md:text-md">{`- ${item.amount} SUI`}</p>
              </div>
            </li>
          )}
        </ul>
      </Modal>
    </>
  );
};