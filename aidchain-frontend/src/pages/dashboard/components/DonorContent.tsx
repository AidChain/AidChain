import React, { useState, useEffect, useRef } from 'react';
import UserProfileCard from "@/components/UserProfileCard";
import Snackbar from "@/components/Snackbar";
import RecipientCard from '@/components/RecipientCard';
import Modal from '@/components/Modal';
import * as Chart from 'chart.js';
import { ChevronDown } from 'lucide-react';
import GradientBorderButton from '@/components/GradientBorderButton';

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

export default function DonorContent() {
  const username = "Test User";
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  const [selectedRecipient, setSelectedRecipient] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

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

  const recipients = [
    {
      id: "rec1",
      recipient: "Seeds of Hope Foundation",
      image: "https://picsum.photos/200/200?random=1",
      description: "Based in rural Kenya, Seeds of Hope provides food, clean water, and school supplies to orphaned children and single-mother households. Donations help fund weekly care packages and tuition aid."
    },
    {
      id: "rec2",
      recipient: "Amaan Refugee Network",
      image: "https://picsum.photos/200/200?random=2",
      description: "Operating across Syrian and Palestinian refugee camps in Jordan, Amaan coordinates essential medical support, baby formula, and emergency aid to families who lack access to stable housing or income."
    },
    {
      id: "rec3",
      recipient: "Bayanihan Women’s Shelter",
      image: "https://picsum.photos/200/200?random=3",
      description: "Located in the Philippines, Bayanihan offers safe housing, meals, and skills training to women escaping domestic abuse. Donations cover essentials like hygiene kits, food, and trauma counseling services."
    },
    {
      id: "rec4",
      recipient: "Northern Highlands Indigenous Support Trust",
      image: "https://picsum.photos/200/200?random=4",
      description: "Serving indigenous Quechua communities in Peru, this trust focuses on providing winter clothing, solar lanterns, and access to telehealth services for elders and children in remote villages."
    }
  ];

  // Hard-coded donation data
  const donationData = {
    all: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [1200, 1500, 900, 2100, 1800, 2400, 2800, 2200, 1900, 2600, 3100, 2900],
      color: 'rgba(59, 130, 246, 1)'
    },
    rec1: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [300, 400, 200, 600, 500, 700, 800, 600, 500, 700, 900, 800],
      color: 'rgba(59, 130, 246, 1)'
    },
    rec2: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [200, 350, 150, 450, 400, 550, 650, 500, 400, 600, 750, 700],
      color: 'rgba(59, 130, 246, 1)'
    },
    rec3: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [400, 450, 300, 550, 500, 650, 750, 600, 550, 700, 800, 750],
      color: 'rgba(59, 130, 246, 1)'
    },
    rec4: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [300, 300, 250, 500, 400, 500, 600, 500, 450, 600, 650, 650],
      color: 'rgba(59, 130, 246, 1)'
    }
  };

  const transactionData = [
    {
      recipient: "Seeds of Hope Foundation",
      amount: 500
    },
    {
      recipient: "Seeds of Hope Foundation",
      amount: 300
    },
    {
      recipient: "Bayanihan Women’s Shelter",
      amount: 350
    },
    {
      recipient: "Northern Highlands Indigenous Support Trust",
      amount: 50
    },
    {
      recipient: "Bayanihan Women’s Shelter",
      amount: 400
    },
    {
      recipient: "Amaan Refugee Network",
      amount: 100
    },
    {
      recipient: "Northern Highlands Indigenous Support Trust",
      amount: 200
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'All Recipients' },
    ...recipients.map(rec => ({ value: rec.id, label: rec.recipient }))
  ];

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const currentData = donationData[selectedRecipient];
      
      chartInstance.current = new Chart.Chart(ctx, {
        type: 'line',
        data: {
          labels: currentData.labels,
          datasets: [{
            label: 'Donations ($)',
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
                  return `$${context.parsed.y.toLocaleString()}`;
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
                  return '$' + value.toLocaleString();
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
  }, [selectedRecipient]);

  const selectedOption = filterOptions.find(option => option.value === selectedRecipient);

  return (
    <>
      <div className="flex flex-col pl-8 md:pl-0 pt-8 pb-8 pr-8 h-full w-full gap-8 md:ml-72 md:overflow-x-scroll mb-24 md:mb-0">
        <div className="flex flex-col gap-2 flex-shrink-0"> {/* Added flex-shrink-0 to prevent header from shrinking */}
          <h2 className="text-white text-3xl sm:text-4xl font-semibold">Welcome back, 
          <span className="text-transparent bg-gradient-to-r from-teal-200 to-blue-500 bg-clip-text"> {username}</span>
          .</h2>
          <p className="text-md sm:text-lg text-slate-300">
            Your transparent donation platform dashboard.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0"> {/* Changed h-full to flex-1 and added min-h-0 */}
          <div className="flex flex-2 flex-col h-full gap-6">
            <div className="flex-shrink-0"> {/* Wrap UserProfileCard to prevent it from shrinking */}
              <UserProfileCard onShowSnackbar={showSnackbar} />
            </div>
            <div className="flex flex-col gap-3 flex-1 min-h-0"> {/* Added min-h-0 */}
              <div className='flex justify-between items-center'>
                <h3 className="text-white text-xl sm:text-2xl font-medium flex-shrink-0">Quick Donate</h3>
                <p className='text-sm text-slate-400'>VIEW ALL</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ul className="h-full w-full overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30 pb-2">
                  {
                    recipients.map((item, index) => (
                      <li key={item.id}>
                        <RecipientCard 
                          recipient={item.recipient}
                          image={item.image}
                          description={item.description}
                        />
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-3 flex-col">
            <div className="flex min-h-full w-full bg-gray-800/50 backdrop-blur-lg border border-blue-400/40 rounded-xl p-6 flex flex-col hover:shadow-xl
        hover:shadow-blue-500/50 transition-all duration-300 ease-in-out">
                {/* Chart Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-xl sm:text-2xl font-medium mb-1">Donation History</h3>
                  
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors w-[160px] truncate justify-between"
                    >
                      <span className="truncate">{selectedOption.label}</span>
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
                      <p className="text-gray-400 text-sm">Total Donated</p>
                      <p className="text-white text-lg font-semibold">
                        ${donationData[selectedRecipient].data.reduce((a, b) => a + b, 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Average/Month</p>
                      <p className="text-white text-lg font-semibold">
                        ${Math.round(donationData[selectedRecipient].data.reduce((a, b) => a + b, 0) / 12).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Highest Month</p>
                      <p className="text-white text-lg font-semibold">
                        ${Math.max(...donationData[selectedRecipient].data).toLocaleString()}
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
                transform: `translateY(${index * -70}px)` // Stack multiple snackbars upward
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
        isOpen = {showTransactionModal}
        onClose = {() => {setShowTransactionModal(false)}}
      >
        <ul className='w-[80vw] md:w-[40vw] flex flex-col overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30'>
          {
        transactionData.map((item, index) => 
            <li key={index} className="relative z-10">
              <div className="flex items-center justify-between w-full bg-white/10 border border-slate-300/10 rounded-lg px-3 py-4 gap-4">
                <p className="text-left text-white/90 text-md md:text-lg max-w-[80%]">
                    {item.recipient}
                </p>
                <p className="text-red-300 text-sm md:text-md">{`- $${item.amount}`}</p>
              </div>
            </li>
            )
          }
        </ul>
      </Modal>
    </>
  );
};