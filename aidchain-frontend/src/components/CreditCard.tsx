'use client'

import Image from 'next/image';

export default function UserProfileCard() {

  return (
    <>
      <div className="w-full mx-auto">
        {/* Frosted Glass Card */}
        <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-6 hover:shadow-xl
        hover:shadow-blue-700/50 transition-all duration-300 ease-in-out">
          {/* Gradient overlay for extra glass effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/80 to-teal-300/80 rounded-2xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Profile Section */}
            <div className="flex items-center justify-between w-full mb-8">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                  <Image
                    src="https://picsum.photos/200"
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white/90 text-lg font-mono bg-black/20 px-3 py-1 rounded-lg">
                    {formatAddress(userAddress)}
                </span>
              </div>

              {/* Address and Actions */}
              <div className="flex min-w-0">
                <div className="flex items-center gap-2">
                  
                  {/* Copy Button */}
                  <button
                    onClick={copyToClipboard}
                    className="cursor-pointer py-3 px-4 hover:bg-white/10 rounded-full transition-colors duration-200 group"
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
                    className="cursor-pointer py-3 px-4 hover:bg-white/10 rounded-full transition-colors duration-200 group"
                    title="Show QR Code"
                  >
                    <QrcodeOutlined 
                      className="text-white/70 group-hover:text-white"
                      style={{ fontSize: '18px' }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Assets Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-regular text-slate-300 mb-2">YOUR ASSETS</h3>
              
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