import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';
import { SuiClient } from '@mysten/sui/client';

export class FaucetService {
  private static readonly TESTNET_HOST = getFaucetHost('testnet');
  private static readonly MIN_SUI_BALANCE = 0.8; // 0.8 SUI minimum threshold
  
  // Track request timing to avoid rate limits
  private static lastRequestTime = 0;
  private static readonly COOLDOWN_TIME = 30000; // 1 minute between requests

  /**
   * Check if user has sufficient SUI balance
   */
  static async checkSuiBalance(userAddress: string): Promise<number> {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SUI_RPC_URL;
      if (!rpcUrl) {
        console.error('RPC URL not configured');
        return 0;
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getBalance',
          params: [userAddress, '0x2::sui::SUI']
        })
      });

      const data = await response.json();
      
      if (data.result && data.result.totalBalance) {
        const balanceInSui = parseInt(data.result.totalBalance) / 1e9;
        console.log(`💰 Current SUI balance: ${balanceInSui.toFixed(4)} SUI`);
        return balanceInSui;
      }

      return 0;
    } catch (error) {
      console.error('Failed to check SUI balance:', error);
      return 0;
    }
  }

  static async requestTestnetSui(recipientAddress: string): Promise<boolean> {
    try {
      // ✅ First check if user already has sufficient SUI
      console.log('🔍 Checking current SUI balance...');
      const currentBalance = await this.checkSuiBalance(recipientAddress);
      
      if (currentBalance >= this.MIN_SUI_BALANCE) {
        console.log(`✅ User already has sufficient SUI (${currentBalance.toFixed(4)} >= ${this.MIN_SUI_BALANCE})`);
        return true; // No need to request more SUI
      }

      console.log(`💧 Balance too low (${currentBalance.toFixed(4)} < ${this.MIN_SUI_BALANCE}), requesting faucet...`);

      // Check rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.COOLDOWN_TIME) {
        console.log(`⏳ Rate limiting: Need to wait ${Math.ceil((this.COOLDOWN_TIME - timeSinceLastRequest) / 1000)}s`);
        return false;
      }

      console.log(`🚰 Requesting testnet SUI for address: ${recipientAddress}`);
      
      // Try official SDK first
      try {
        await requestSuiFromFaucetV2({
          host: this.TESTNET_HOST,
          recipient: recipientAddress,
        });
        
        this.lastRequestTime = now;
        console.log('✅ Successfully received testnet SUI from official SDK');
        
        // Verify the new balance
        setTimeout(async () => {
          const newBalance = await this.checkSuiBalance(recipientAddress);
          console.log(`💰 New balance after faucet: ${newBalance.toFixed(4)} SUI`);
        }, 2000);
        
        return true;
        
      } catch (sdkError: any) {
        console.log('📡 Official SDK failed, trying server-side route...');
        
        // If SDK fails, try server-side API route
        const response = await fetch('/api/faucet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipient: recipientAddress }),
        });

        const result = await response.json();
        
        if (result.success) {
          this.lastRequestTime = now;
          console.log('✅ Successfully received testnet SUI via server route');
          
          // Verify the new balance
          setTimeout(async () => {
            const newBalance = await this.checkSuiBalance(recipientAddress);
            console.log(`💰 New balance after faucet: ${newBalance.toFixed(4)} SUI`);
          }, 2000);
          
          return true;
        } else {
          console.error('❌ Server route failed:', result.error);
          
          // Set cooldown even on failure to prevent spam
          if (result.status === 429 || result.error?.includes('Too many requests')) {
            this.lastRequestTime = now;
          }
          
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Failed to request SUI from faucet:', error);
      return false;
    }
  }

  static canMakeRequest(): boolean {
    return (Date.now() - this.lastRequestTime) >= this.COOLDOWN_TIME;
  }

  static getSecondsUntilNextRequest(): number {
    const timeLeft = this.COOLDOWN_TIME - (Date.now() - this.lastRequestTime);
    return Math.max(0, Math.ceil(timeLeft / 1000));
  }
}