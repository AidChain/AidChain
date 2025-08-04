import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

const client = new SuiClient({
  url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl('testnet'),
});

export const PACKAGE_ID = process.env.NEXT_PUBLIC_DONATION_POOL_PACKAGE_ID!;
export const DONATION_POOL_ID = process.env.NEXT_PUBLIC_DONATION_POOL_OBJECT_ID!;
export const ADMIN_CAP_ID = process.env.NEXT_PUBLIC_ADMIN_CAP_OBJECT!;

export async function createDonationTransaction(
  donorAddress: string,
  amount: number
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(donorAddress);

  // Split SUI coin for donation
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);

  // Call donate function
  tx.moveCall({
    target: `${PACKAGE_ID}::donation_pool::donate`,
    arguments: [
      tx.object(DONATION_POOL_ID),
      coin
    ],
  });

  return tx;
}

export async function createDonationCardTransaction(
  adminAddress: string,
  title: string,
  description: string,
  targetAddress: string | null,
  targetName: string,
  imageBlobId: string | null,
  gallery_images: string[] | null,
  goalAmount: number
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(adminAddress);

  tx.moveCall({
    target: `${PACKAGE_ID}::donation_pool::create_donation_card`,
    arguments: [
      tx.object(ADMIN_CAP_ID),
      tx.pure.string(title),
      tx.pure.string(description),
      targetAddress ? tx.pure.option('address', targetAddress) : tx.pure.option('address', null),
      tx.pure.string(targetName),
      imageBlobId ? tx.pure.option('string', imageBlobId) : tx.pure.option('string', null),
      gallery_images && gallery_images.length > 0
        ? tx.pure.option('vector<string>', gallery_images)
        : tx.pure.option('vector<string>', null),
      tx.pure.u64(goalAmount),
      tx.object('0x6'), // Clock object
    ],
  });

  return tx;
}

export async function createDonationToCardTransaction(
  donorAddress: string,
  cardId: string,
  amount: number,
  message: string | null
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(donorAddress);

  // Split SUI coin for donation
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);

  // Call donate_to_card function
  tx.moveCall({
    target: `${PACKAGE_ID}::donation_pool::donate_to_card`,
    arguments: [
      tx.object(cardId),
      tx.object(DONATION_POOL_ID),
      coin,
      message ? tx.pure.option('string', message) : tx.pure.option('string', null),
      tx.object('0x6'), // Clock object
    ],
  });

  return tx;
}


export { client as suiClient };