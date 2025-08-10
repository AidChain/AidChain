import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export interface DonationCardData {
  id: string;
  title: string;
  description: string;
  target_address: string | null;
  target_name: string;
  image_blob_id: string | null;
  gallery_images: string[] | null;
  total_raised: number; // Convert from MIST to SUI for display
  goal_amount: number;  // Convert from MIST to SUI for display
  balance: number;      // Convert from MIST to SUI for display
  is_active: boolean;
  created_at: number;
  // Helper fields for UI
  progress_percentage: number;
  raised_formatted: string;
  goal_formatted: string;
}

export class DonationCardService {
  private suiClient: SuiClient;

  PACKAGE_ID = process.env.NEXT_PUBLIC_DONATION_POOL_PACKAGE_ID || '0xf7bac49b4baea4c93c02f486ee4f2c6159b65de2192f047325ff5519b874dc76';
  DONATION_POOL_OBJECT_ID = process.env.NEXT_PUBLIC_DONATION_POOL_OBJECT_ID || '0xc234aef71f286782a4aa6d1f2da570da52d779e7cc55029e6832c1a3c7cb3425';
  
  // ✅ Admin address still useful for other operations
  ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '';

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.suiClient = new SuiClient({ 
      url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl(network) 
    });
  }

  /**
   * ✅ Brilliant approach: Fetch donation cards via the donation pool object
   * This is much more reliable than querying shared objects directly
   */
  async fetchAllDonationCards(): Promise<DonationCardData[]> {
    try {
      console.log('🔍 Fetching donation cards from donation pool...');
      console.log('🔍 Pool ID:', this.DONATION_POOL_OBJECT_ID);
      
      // ✅ Get the donation pool object which should contain references to all cards
      const poolResponse = await this.suiClient.getObject({
        id: this.DONATION_POOL_OBJECT_ID,
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      });

      if (!poolResponse.data?.content || !('fields' in poolResponse.data.content)) {
        console.error('❌ No donation pool content found');
        return [];
      }

      const poolFields = poolResponse.data.content.fields as any;
      console.log('🔍 Pool fields:', Object.keys(poolFields));

      // ✅ Look for donation cards in the pool
      // The structure might be: donation_cards: { type: "vector", fields: [...] }
      // or donation_cards: { type: "Table", fields: { id: {...}, size: "..." } }
      let cardIds: string[] = [];

      if (poolFields.donation_cards) {
        if (Array.isArray(poolFields.donation_cards)) {
          // Direct array of card IDs
          cardIds = poolFields.donation_cards;
        } else if (poolFields.donation_cards.fields) {
          // Vector or Table structure
          if (Array.isArray(poolFields.donation_cards.fields)) {
            cardIds = poolFields.donation_cards.fields;
          } else if (poolFields.donation_cards.fields.contents) {
            // Table contents
            cardIds = poolFields.donation_cards.fields.contents || [];
          }
        }
      }

      console.log(`🔍 Found ${cardIds.length} donation card IDs in pool`);

      if (cardIds.length === 0) {
        console.log('⚠️ No donation cards found in pool');
        return [];
      }

      // ✅ Fetch all donation cards using multiGetObjects
      const cardsResponse = await this.suiClient.multiGetObjects({
        ids: cardIds,
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      });

      const cards: DonationCardData[] = [];

      for (const item of cardsResponse) {
        if (item.data?.content && 'fields' in item.data.content) {
          const fields = item.data.content.fields as any;
          
          try {
            // ✅ Handle balance field properly - it might be nested
            let balanceValue = 0;
            if (fields.balance) {
              // Balance might be a nested object with a 'value' field
              if (typeof fields.balance === 'object' && fields.balance.fields?.value) {
                balanceValue = parseInt(fields.balance.fields.value);
              } else if (typeof fields.balance === 'string' || typeof fields.balance === 'number') {
                balanceValue = parseInt(fields.balance.toString());
              }
            }
            
            // Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
            const totalRaisedSui = parseInt(fields.total_raised) / 1_000_000_000;
            const goalAmountSui = parseInt(fields.goal_amount) / 1_000_000_000;
            const balanceSui = balanceValue / 1_000_000_000;
            
            // Calculate progress percentage
            const progressPercentage = goalAmountSui > 0 
              ? Math.min((totalRaisedSui / goalAmountSui) * 100, 100) 
              : 0;

            // ✅ Handle optional fields properly
            const card: DonationCardData = {
              id: item.data.objectId,
              title: fields.title || 'Untitled',
              description: fields.description || '',
              target_address: fields.target_address?.fields || null,
              target_name: fields.target_name || 'Unknown',
              image_blob_id: fields.image_blob_id?.fields || null,
              gallery_images: fields.gallery_images?.fields || null,
              total_raised: totalRaisedSui,
              goal_amount: goalAmountSui,
              balance: balanceSui,
              is_active: fields.is_active !== false, // Default to true if undefined
              created_at: parseInt(fields.created_at) || Date.now(),
              progress_percentage: progressPercentage,
              raised_formatted: `${totalRaisedSui.toFixed(2)} SUI`,
              goal_formatted: goalAmountSui > 0 ? `${goalAmountSui.toFixed(2)} SUI` : 'No Goal'
            };

            // Only include active cards
            if (card.is_active) {
              cards.push(card);
              console.log(`✅ Added active card: ${card.title} (${card.id})`);
            } else {
              console.log(`⚠️ Skipped inactive card: ${card.title} (${card.id})`);
            }
          } catch (parseError) {
            console.error('❌ Failed to parse card data:', parseError, fields);
          }
        } else {
          console.log('⚠️ Card data not found for ID:', item.data?.objectId);
        }
      }

      console.log(`✅ Successfully fetched ${cards.length} active donation cards from pool`);
      return cards.sort((a, b) => b.created_at - a.created_at); // Sort by newest first

    } catch (error) {
      console.error('❌ Failed to fetch donation cards from pool:', error);
      return [];
    }
  }

  /**
   * ✅ Debugging method to inspect the donation pool structure
   */
  async debugDonationPool(): Promise<void> {
    try {
      console.log('🔍 Debug: Inspecting donation pool structure...');
      
      const poolResponse = await this.suiClient.getObject({
        id: this.DONATION_POOL_OBJECT_ID,
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      });

      console.log('🔍 Pool response:', {
        objectId: poolResponse.data?.objectId,
        type: poolResponse.data?.type,
        owner: poolResponse.data?.owner
      });

      if (poolResponse.data?.content && 'fields' in poolResponse.data.content) {
        const fields = poolResponse.data.content.fields as any;
        console.log('🔍 Pool fields:', fields);
        
        // Log each field type and structure
        Object.keys(fields).forEach(key => {
          console.log(`🔍 Field "${key}":`, typeof fields[key], fields[key]);
        });
      }
    } catch (error) {
      console.error('❌ Debug failed:', error);
    }
  }

  /**
   * Fetch a specific donation card by ID
   */
  async fetchDonationCard(cardId: string): Promise<DonationCardData | null> {
    try {
      const response = await this.suiClient.getObject({
        id: cardId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      });

      if (response.data?.content && 'fields' in response.data.content) {
        const fields = response.data.content.fields as any;
        
        // ✅ Handle balance field properly
        let balanceValue = 0;
        if (fields.balance) {
          if (typeof fields.balance === 'object' && fields.balance.fields?.value) {
            balanceValue = parseInt(fields.balance.fields.value);
          } else if (typeof fields.balance === 'string' || typeof fields.balance === 'number') {
            balanceValue = parseInt(fields.balance.toString());
          }
        }
        
        const totalRaisedSui = parseInt(fields.total_raised) / 1_000_000_000;
        const goalAmountSui = parseInt(fields.goal_amount) / 1_000_000_000;
        const balanceSui = balanceValue / 1_000_000_000;
        
        const progressPercentage = goalAmountSui > 0 
          ? Math.min((totalRaisedSui / goalAmountSui) * 100, 100) 
          : 0;

        return {
          id: response.data.objectId,
          title: fields.title || 'Untitled',
          description: fields.description || '',
          target_address: fields.target_address?.fields || null,
          target_name: fields.target_name || 'Unknown',
          image_blob_id: fields.image_blob_id?.fields || null,
          gallery_images: fields.gallery_images?.fields || null,
          total_raised: totalRaisedSui,
          goal_amount: goalAmountSui,
          balance: balanceSui,
          is_active: fields.is_active !== false,
          created_at: parseInt(fields.created_at) || Date.now(),
          progress_percentage: progressPercentage,
          raised_formatted: `${totalRaisedSui.toFixed(2)} SUI`,
          goal_formatted: goalAmountSui > 0 ? `${goalAmountSui.toFixed(2)} SUI` : 'No Goal'
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to fetch donation card:', error);
      return null;
    }
  }

  /**
   * ✅ Helper function to set admin address dynamically
   */
  setAdminAddress(adminAddress: string) {
    this.ADMIN_ADDRESS = adminAddress;
  }
}

export const donationCardService = new DonationCardService();