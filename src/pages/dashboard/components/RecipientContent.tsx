"use client"

import React, { useState, useEffect, useRef } from 'react';
import CreditCard from '@/components/CreditCard';
import Snackbar from '@/components/Snackbar';
import Modal from '@/components/Modal';
import * as Chart from 'chart.js';
import { ChevronDown } from 'lucide-react';

export default function RecipientContent() {
  const username = "Test User"
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [timeFilter, setTimeFilter] = useState('year');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [snackbars, setSnackbars] = useState<Array<{
        id: number;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        isVisible: boolean;
      }>>([]);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    
    const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      const id = Date.now();
      setSnackbars(prev => [...prev, { id, message, type, isVisible: true }]);
    };
  
    const closeSnackbar = (id: number) => {
      setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
    };

    const transactionDataBrief = [
      {
        recipient: "Walmart",
        amount: 50
      },
      {
        recipient: "Soup Kitchen",
        amount: 10
      },
      {
        recipient: "Good Will",
        amount: 20
      },
      {
        recipient: "Walmart",
        amount: 30
      },
    ]

    const transactionData = [
    {
      recipient: "Walmart",
      amount: 50
    },
    {
      recipient: "Soup Kitchen",
      amount: 10
    },
    {
      recipient: "Good Will",
      amount: 20
    },
    {
      recipient: "Walmart",
      amount: 30
    },
    {
      recipient: "Soup Kitchen",
      amount: 5
    },
    {
      recipient: "Good Will",
      amount: 40
    },
    {
      recipient: "Walmart",
      amount: 25
    },
  ];

  const filterOptions = [
    { value: 'month', label: 'Past Month' },
    { value: '3months', label: 'Past 3 Months' },
    { value: '6months', label: 'Past 6 Months' },
    { value: 'year', label: 'Past Year' }
  ];

  const selectedOption = filterOptions.find(option => option.value === timeFilter);

  // Expenditure data by time period
  const expenditureByPeriod = {
    month: {
      labels: ['Food', 'Education', 'Healthcare', 'Housing', 'Transportation', 'Utilities'],
      data: [680, 750, 320, 1400, 180, 290],
      total: 3620,
      period: 'Past Month'
    },
    '3months': {
      labels: ['Food', 'Education', 'Healthcare', 'Housing', 'Transportation', 'Utilities'],
      data: [2150, 1200, 1850, 4200, 720, 680],
      total: 10800,
      period: 'Past 3 Months'
    },
    '6months': {
      labels: ['Food', 'Education', 'Healthcare', 'Housing', 'Transportation', 'Utilities'],
      data: [3900, 4500, 2400, 8400, 980, 1520],
      total: 21700,
      period: 'Past 6 Months'
    },
    year: {
      labels: ['Food', 'Education', 'Healthcare', 'Housing', 'Transportation', 'Utilities'],
      data: [8200, 12600, 3800, 16800, 2100, 3400],
      total: 46900,
      period: 'Past Year'
    }
  };

  const currentData = expenditureByPeriod[timeFilter];

  // Create gradients and setup chart data
  const createGradients = (ctx) => {
    const gradients = [];
    const colors = [
      { start: '#93C5FD80', end: '#3B82F680', glow: '#3B82F6' }, // Pale Blue
      { start: '#6EE7B780', end: '#10B98180', glow: '#10B981' }, // Pale Green
      { start: '#FCD34D80', end: '#F59E0B80', glow: '#F59E0B' }, // Pale Yellow
      { start: '#F87171B0', end: '#EF444480', glow: '#EF4444' }, // Pale Red
      { start: '#C4B5FD80', end: '#8B5CF680', glow: '#8B5CF6' }, // Pale Purple
      { start: '#67E8F980', end: '#06B6D480', glow: '#06B6D4' }  // Pale Cyan
    ];

    colors.forEach((color) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color.start);
      gradient.addColorStop(1, color.end);
      gradients.push(gradient);
    });

    return { gradients, glowColors: colors.map(c => c.glow) };
  };

  // Mock expenditure data by category
  const expenditureData = {
    labels: currentData.labels,
    datasets: [{
      label: 'Expenditure ($)',
      data: currentData.data,
      backgroundColor: [], // Will be set dynamically with gradients
      borderColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#06B6D4'
      ],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3B82F6',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94A3B8',
          callback: function(value) {
            return '$' + value;
          }
        },
        grid: {
          color: '#374151',
          drawBorder: false,
        }
      },
      x: {
        ticks: {
          color: '#94A3B8'
        },
        grid: {
          display: false
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  // Initialize chart
  useEffect(() => {
    if (chartRef.current) {
      // Register Chart.js components
      Chart.Chart.register(
        Chart.CategoryScale,
        Chart.LinearScale,
        Chart.BarElement,
        Chart.BarController,
        Chart.Title,
        Chart.Tooltip,
        Chart.Legend
      );

      const ctx = chartRef.current.getContext('2d');
      
      // Create gradients
      const { gradients } = createGradients(ctx);
      
      // Set the gradient backgrounds
      expenditureData.datasets[0].backgroundColor = gradients;
      
      // Destroy existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      chartInstanceRef.current = new Chart.Chart(ctx, {
        type: 'bar',
        data: expenditureData,
        options: chartOptions
      });
    }

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [timeFilter]); // Added timeFilter as dependency

  return (
    <>
      <div className="flex flex-col pt-8 pb-8 pr-8 pl-8 md:pl-0 h-full w-full gap-8 md:ml-72 mb-24 md:mb-0 md:overflow-x-scroll">
        <div className="flex flex-col gap-2 flex-shrink-0">
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
              <CreditCard onShowSnackbar={showSnackbar} />
            </div>
            <div className="flex flex-col gap-3 flex-1 min-h-0"> {/* Added min-h-0 */}
              <div className='flex justify-between items-center'>
                <h3 className="text-white text-xl sm:text-2xl font-medium flex-shrink-0">Transaction Details</h3>
                <button 
                  className='cursor-pointer text-sm text-slate-400 hover:text-white' 
                  onClick={() => setShowTransactionModal(true)}
                >
                  VIEW ALL
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ul className="h-full w-full overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30 pb-2">
                  {
                    transactionDataBrief.map((item, index) => 
                    <li key={index} className="relative z-10 bg-white/10 backdrop-blur-lg border border-blue-400/40 rounded-lg">
                      <div className="flex items-center justify-between w-full bg-gradient-to-r from-blue-500/30 to-transparent px-3 py-4 gap-4">
                        <p className="text-left text-white/90 text-md md:text-lg max-w-[80%]">
                            {item.recipient}
                        </p>
                        <p className="text-red-300 text-sm md:text-md">{`- $${item.amount}`}</p>
                      </div>
                    </li>
                    )
                  }
                </ul>
              </div>
            </div>
          </div>
        <div className="flex flex-3 flex-col">
          <div className="flex min-h-full w-full bg-gray-800/50 backdrop-blur-lg border border-blue-400/40 rounded-xl p-6 flex flex-col hover:shadow-xl
      hover:shadow-blue-500/50 transition-all duration-300 ease-in-out">
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-xl sm:text-2xl font-medium">Expenditure by Category</h3>
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors min-w-[160px] justify-between"
                    >
                      <span className="truncate">{selectedOption.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[160px]">
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTimeFilter(option.value);
                              setIsDropdownOpen(false);
                            }}
                            className={`cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                              timeFilter === option.value ? 'bg-gray-700 text-blue-400' : 'text-white'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <canvas ref={chartRef} className="w-full h-full"></canvas>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-gray-400 text-sm">Total Spent</p>
                      <p className="text-white text-lg font-semibold">
                        ${currentData.total.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Average/Category</p>
                      <p className="text-white text-lg font-semibold">
                        ${Math.round(currentData.total / currentData.data.length).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Highest Category</p>
                      <p className="text-white text-lg font-semibold">
                        ${Math.max(...currentData.data).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {currentData.labels.map((label, index) => {
                    const colors = ['#93C5FD', '#6EE7B7', '#FCD34D', '#F87171', '#C4B5FD', '#67E8F9'];
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: colors[index] }}
                        ></div>
                        <span className="text-slate-300">{label}: ${currentData.data[index].toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
          </div>
        </div>
      </div>
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