'use client'

import { useZkLogin } from '@/providers/ZkLoginProvider';
import { CopyOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import QRCodeModal from './QRCodeModal';

interface Asset {
  type: string;
  balance: string;
  symbol: string;
  decimals: number;
  coinType: string;
}

interface SuiCoinBalance {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance: {
    epochId?: string;
    number?: string;
  };
}

export default function UserProfileCard() {
  const { userAddress, isAuthenticated } = useZkLogin();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch user assets from Sui testnet
  useEffect(() => {
    const fetchAssets = async () => {
      if (!userAddress) return;
      
      setIsLoading(true);
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_SUI_RPC_URL;
        
        if (!rpcUrl) {
          console.error('RPC URL not configured');
          setAssets([]);
          return;
        }

        // Fetch all coin balances for the user
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getAllBalances',
            params: [userAddress],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message);
        }

        const balances: SuiCoinBalance[] = data.result || [];
        
        // Process and format the assets
        const processedAssets: Asset[] = await Promise.all(
          balances.map(async (balance) => {
            const asset = await processCoinBalance(balance, rpcUrl);
            return asset;
          })
        );

        // Filter out assets with zero balance and sort by balance (descending)
        const filteredAssets = processedAssets
          .filter(asset => parseFloat(asset.balance) > 0)
          .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));

        setAssets(filteredAssets);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        setAssets([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && userAddress) {
      fetchAssets();
    } else {
      setIsLoading(false);
      setAssets([]);
    }
  }, [isAuthenticated, userAddress]);

  // Process individual coin balance and get metadata
  const processCoinBalance = async (balance: SuiCoinBalance, rpcUrl: string): Promise<Asset> => {
    try {
      // Handle SUI coin specially
      if (balance.coinType === '0x2::sui::SUI') {
        const formattedBalance = (parseInt(balance.totalBalance) / 1e9).toFixed(4);
        return {
          type: balance.coinType,
          balance: formattedBalance,
          symbol: 'SUI',
          decimals: 9,
          coinType: balance.coinType,
        };
      }

      // For other coins, try to fetch metadata
      try {
        const metadataResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getCoinMetadata',
            params: {
              coinType: balance.coinType,
            },
          }),
        });

        const metadataData = await metadataResponse.json();
        
        if (metadataData.result) {
          const metadata = metadataData.result;
          const decimals = metadata.decimals || 9;
          const symbol = metadata.symbol || extractSymbolFromType(balance.coinType);
          const formattedBalance = (parseInt(balance.totalBalance) / Math.pow(10, decimals)).toFixed(4);
          
          return {
            type: balance.coinType,
            balance: formattedBalance,
            symbol: symbol,
            decimals: decimals,
            coinType: balance.coinType,
          };
        }
      } catch (metadataError) {
        console.warn('Failed to fetch metadata for', balance.coinType, metadataError);
      }

      // Fallback for unknown coins
      const symbol = extractSymbolFromType(balance.coinType);
      const formattedBalance = (parseInt(balance.totalBalance) / 1e9).toFixed(4);
      
      return {
        type: balance.coinType,
        balance: formattedBalance,
        symbol: symbol,
        decimals: 9,
        coinType: balance.coinType,
      };
    } catch (error) {
      console.error('Error processing coin balance:', error);
      const symbol = extractSymbolFromType(balance.coinType);
      const formattedBalance = (parseInt(balance.totalBalance) / 1e9).toFixed(4);
      
      return {
        type: balance.coinType,
        balance: formattedBalance,
        symbol: symbol,
        decimals: 9,
        coinType: balance.coinType,
      };
    }
  };

  // Extract symbol from coin type (fallback method)
  const extractSymbolFromType = (coinType: string): string => {
    // Extract the last part after :: as symbol
    const parts = coinType.split('::');
    const lastPart = parts[parts.length - 1];
    
    // Convert to uppercase and limit length
    return lastPart.toUpperCase().substring(0, 8);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const copyToClipboard = async () => {
    if (!userAddress) return;
    
    try {
      await navigator.clipboard.writeText(userAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isAuthenticated || !userAddress) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-2xl mx-auto">
        {/* Frosted Glass Card */}
        <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Gradient overlay for extra glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Profile Section */}
            <div className="flex items-start space-x-6 mb-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/30">
                  <Image
                    src="https://picsum.photos/200"
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Address and Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-white/90 text-lg font-mono bg-black/20 px-3 py-1 rounded-lg">
                    {formatAddress(userAddress)}
                  </span>
                  
                  {/* Copy Button */}
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                    title="Copy full address"
                  >
                    <CopyOutlined 
                      className="text-white/70 group-hover:text-white"
                      style={{ fontSize: '18px' }}
                    />
                  </button>
                  
                  {/* QR Code Button */}
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                    title="Show QR Code"
                  >
                    <QrcodeOutlined 
                      className="text-white/70 group-hover:text-white"
                      style={{ fontSize: '18px' }}
                    />
                  </button>
                </div>

                {/* Copy Feedback */}
                {copied && (
                  <div className="text-green-400 text-sm">
                    ✓ Address copied to clipboard
                  </div>
                )}
              </div>
            </div>

            {/* Assets Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Your Assets</h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg animate-pulse">
                      <div className="h-4 bg-white/20 rounded w-1/3"></div>
                      <div className="h-4 bg-white/20 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : assets.length > 0 ? (
                <div className="space-y-3">
                  {assets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          asset.symbol === 'SUI' 
                            ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                            : 'bg-gradient-to-r from-teal-400 to-blue-500'
                        }`}>
                          <span className="text-white font-bold text-sm">{asset.symbol[0]}</span>
                        </div>
                        <div>
                          <span className="text-white font-medium">{asset.symbol}</span>
                          {asset.symbol !== 'SUI' && (
                            <div className="text-xs text-white/50 font-mono truncate max-w-[200px]">
                              {asset.coinType}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-white/90 font-mono">{asset.balance}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-white/70 mb-4">No assets found in your wallet</p>
                  <a
                    href="https://faucet.sui.io/?network=testnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    Obtain free Testnet SUI here!
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        address={userAddress}
      />
    </>
  );
}