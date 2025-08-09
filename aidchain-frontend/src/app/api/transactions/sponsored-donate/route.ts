import { NextRequest, NextResponse } from 'next/server';
import { enokiBackend } from '@/lib/enoki-backend';
import { Transaction } from '@mysten/sui/transactions';
import { suiClient, PACKAGE_ID, DONATION_POOL_OBJECT_ID } from '@/lib/sui-transactions';

export async function POST(request: NextRequest) {
  try {
    const { donorAddress, cardId, amount, message } = await request.json();

    // Validate required fields
    if (!donorAddress || !cardId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: donorAddress, cardId, amount' },
        { status: 400 }
      );
    }

    // Validate minimum donation (0.5 SUI = 500,000,000 MIST)
    const amountInMist = Math.floor(amount * 1_000_000_000);
    if (amountInMist < 500_000_000) {
      return NextResponse.json(
        { error: 'Minimum donation is 0.5 SUI' },
        { status: 400 }
      );
    }

    console.log('🔍 Creating sponsored donation transaction:', {
      donorAddress,
      cardId,
      amount,
      amountInMist,
      message
    });

    // ✅ Step 1: Create the transaction for sponsored execution
    const tx = new Transaction();
    
    // ✅ For sponsored transactions, we need to get SUI coins from the donor's account
    // First, get the donor's SUI coins
    const coinsResponse = await suiClient.getCoins({
      owner: donorAddress,
      coinType: '0x2::sui::SUI'
    });

    if (!coinsResponse.data || coinsResponse.data.length === 0) {
      return NextResponse.json(
        { error: 'Donor has no SUI coins to donate' },
        { status: 400 }
      );
    }

    // Find a coin with enough balance or merge coins if needed
    let totalBalance = 0;
    const availableCoins = coinsResponse.data.filter(coin => {
      totalBalance += parseInt(coin.balance);
      return parseInt(coin.balance) > 0;
    });

    if (totalBalance < amountInMist) {
      return NextResponse.json(
        { error: `Insufficient balance. Need ${amountInMist} MIST, have ${totalBalance} MIST` },
        { status: 400 }
      );
    }

    // ✅ Use actual coins from the donor's account instead of tx.gas
    let donationCoin;

    if (parseInt(availableCoins[0].balance) >= amountInMist) {
      // If the first coin has enough balance, split from it
      const [splitCoin] = tx.splitCoins(tx.object(availableCoins[0].coinObjectId), [amountInMist]);
      donationCoin = splitCoin;
    } else {
      // If we need to merge coins, merge them first then split
      const primaryCoin = tx.object(availableCoins[0].coinObjectId);
      const coinsToMerge = availableCoins.slice(1, 5).map(coin => tx.object(coin.coinObjectId)); // Limit to avoid gas issues
      
      if (coinsToMerge.length > 0) {
        tx.mergeCoins(primaryCoin, coinsToMerge);
      }
      
      const [splitCoin] = tx.splitCoins(primaryCoin, [amountInMist]);
      donationCoin = splitCoin;
    }
    
    // Call the donate_to_card function
    const receipt = tx.moveCall({
      target: `${PACKAGE_ID}::donation_pool::donate_to_card`,
      arguments: [
        tx.object(cardId), // DonationCard object
        tx.object(DONATION_POOL_OBJECT_ID), // DonationPool object
        donationCoin, // ✅ Use the actual donation coin, not gas coin
        tx.pure.option('string', message || null), // Optional message
        tx.object('0x6'), // Clock object
      ],
    });
    
    // ✅ Transfer the receipt to the donor
    tx.transferObjects([receipt], donorAddress);
    
    // ✅ Set sender (but don't set gas settings for sponsored transactions)
    tx.setSender(donorAddress);

    // ✅ Step 2: Build transaction bytes for sponsored transactions
    // For Enoki, we need only the transaction kind, not the full transaction
    const txBytes = await tx.build({ 
      client: suiClient,
      onlyTransactionKind: true // ✅ TRUE for sponsored transactions
    });

    console.log('🔍 Transaction bytes length:', txBytes.length);
    console.log('🔍 Available coins:', availableCoins.length, 'Total balance:', totalBalance);

    // ✅ Step 3: Create sponsored transaction with Enoki
    const sponsoredTx = await enokiBackend.createSponsoredTransaction({
      network: 'testnet',
      transactionKindBytes: Buffer.from(txBytes).toString('base64'),
      sender: donorAddress,
      allowedMoveCallTargets: [
        `${PACKAGE_ID}::donation_pool::donate_to_card`
      ]
    });

    console.log('✅ Sponsored transaction created:', sponsoredTx.digest);

    return NextResponse.json({
      success: true,
      digest: sponsoredTx.digest,
      txBytes: Buffer.from(txBytes).toString('base64')
    });

  } catch (error) {
    console.error('❌ Sponsored transaction creation failed:', error);
    
    // ✅ Better error logging for Enoki errors
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });

      // ✅ Log Enoki-specific error details if available
      if ('errors' in error && Array.isArray(error.errors)) {
        console.error('Enoki errors:', error.errors);
      }
      if ('status' in error) {
        console.error('Enoki status:', error.status);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create sponsored transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}