import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Initialize Sui client
export const suiClient = new SuiClient({
  url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl('testnet')
});

// Package and object IDs from environment
export const PACKAGE_ID = process.env.NEXT_PUBLIC_DONATION_POOL_PACKAGE_ID!;
export const DONATION_POOL_OBJECT_ID = process.env.NEXT_PUBLIC_DONATION_POOL_OBJECT_ID!;
export const ADMIN_CAP_OBJECT_ID = process.env.NEXT_PUBLIC_ADMIN_CAP_OBJECT!;

// ✅ Admin keypair - using the working method
const ADMIN_PRIVATE_KEY = "suiprivkey1qzemstwhtuzavsw9he0h25wz62840hzt3je3a8amgvvjpmf9ezvwvy3p2ct";
export const adminKeypair = Ed25519Keypair.fromSecretKey(ADMIN_PRIVATE_KEY);

/**
 * ✅ Creates a transaction to donate to a specific donation card
 * Now works with shared objects (no ownership issues)
 */
export async function createDonationToCardTransaction(
  donorAddress: string,
  cardId: string,
  amountInMist: number,
  message?: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  // Split coins for the donation amount
  const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
  
  // ✅ Call the donate_to_card function (now works with shared objects)
  const receipt = tx.moveCall({
    target: `${PACKAGE_ID}::donation_pool::donate_to_card`,
    arguments: [
      tx.object(cardId), // DonationCard object (now shared)
      tx.object(DONATION_POOL_OBJECT_ID), // DonationPool object (shared)
      coin, // Donation amount
      tx.pure.option('string', message || null), // Optional message
      tx.object('0x6'), // Clock object
    ],
  });
  
  // ✅ Transfer the receipt to the donor
  tx.transferObjects([receipt], donorAddress);
  
  // Set sender
  tx.setSender(donorAddress);
  
  return tx;
}

/**
 * ✅ Creates a transaction to create a new donation card (admin only)
 * Updated to support total_raised parameter and shared objects
 */
export async function createDonationCardTransaction(
  title: string,
  description: string,
  targetAddress: string | null,
  targetName: string,
  imageBlobId: string | null,
  galleryImages: string[] | null,
  totalRaised: number,
  goalAmount: number // in SUI, will be converted to MIST
): Promise<Transaction> {
  const tx = new Transaction();
  
  // ✅ Set explicit gas budget
  tx.setGasBudget(200_000_000);
  
  // Convert amounts from SUI to MIST
  const goalAmountMist = Math.floor(goalAmount * 1_000_000_000);
  const totalRaisedMist = Math.floor(totalRaised * 1_000_000_000);
  
  // ✅ Create the donation card with total_raised parameter
  tx.moveCall({
    target: `${PACKAGE_ID}::donation_pool::create_donation_card`,
    arguments: [
      tx.object(ADMIN_CAP_OBJECT_ID), // AdminCap
      tx.object(DONATION_POOL_OBJECT_ID), // ✅ Add this
      tx.pure.string(title),
      tx.pure.string(description),
      targetAddress ? tx.pure.option('address', targetAddress) : tx.pure.option('address', null),
      tx.pure.string(targetName),
      imageBlobId ? tx.pure.option('string', imageBlobId) : tx.pure.option('string', null),
      galleryImages && galleryImages.length > 0 
        ? tx.pure.option('vector<string>', galleryImages)
        : tx.pure.option('vector<string>', null),
      tx.pure.u64(totalRaisedMist), // ✅ Initial total_raised in MIST
      tx.pure.u64(goalAmountMist), // Goal amount in MIST
      tx.object('0x6'), // Clock object
    ],
  });
  
  // ✅ No need to transfer - the smart contract makes it a shared object
  
  // Set sender as admin
  tx.setSender(adminKeypair.getPublicKey().toSuiAddress());
  
  return tx;
}

/**
 * Signs and executes a transaction with admin keypair
 */
export async function executeTransactionAsAdmin(tx: Transaction) {
  try {
    console.log('🔍 Admin address:', adminKeypair.getPublicKey().toSuiAddress());
    console.log('🚀 Executing transaction...');
    
    const result = await suiClient.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });
    
    console.log('✅ Transaction executed:', result.digest);
    
    if (result.objectChanges) {
      const createdObjects = result.objectChanges.filter(change => change.type === 'created');
      const sharedObjects = result.objectChanges.filter(change => change.type === 'published' || change.type === 'mutated');
      console.log('📦 Created objects:', createdObjects);
      console.log('🔗 Shared objects:', sharedObjects);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to execute transaction:', error);
    throw error;
  }
}

// ✅ Add helper function to get admin address for debugging
export function getAdminAddress(): string {
  return adminKeypair.getPublicKey().toSuiAddress();
}