import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';

export class FaucetService {
  private static readonly TESTNET_HOST = getFaucetHost('testnet');
  
  // Track request timing to avoid rate limits
  private static lastRequestTime = 0;
  private static readonly COOLDOWN_TIME = 60000; // 1 minute between requests

  static async requestTestnetSui(recipientAddress: string): Promise<boolean> {
    try {
      // Check rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.COOLDOWN_TIME) {
        console.log(`⏳ Rate limiting: Need to wait ${Math.ceil((this.COOLDOWN_TIME - timeSinceLastRequest) / 1000)}s`);
        return false;
      }

      console.log(`Requesting testnet SUI for address: ${recipientAddress}`);
      
      // Try official SDK first
      try {
        await requestSuiFromFaucetV2({
          host: this.TESTNET_HOST,
          recipient: recipientAddress,
        });
        
        this.lastRequestTime = now;
        console.log('✅ Successfully received testnet SUI from official SDK');
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
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    return timeSinceLastRequest >= this.COOLDOWN_TIME;
  }

  static getSecondsUntilNextRequest(): number {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const timeUntilNext = this.COOLDOWN_TIME - timeSinceLastRequest;
    return Math.ceil(Math.max(0, timeUntilNext) / 1000);
  }
}