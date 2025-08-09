'use client';

import React, { useEffect } from 'react';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';

export function EnokiWalletRegistration() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!isEnokiNetwork(network)) {
      console.log('🌐 Network not supported by Enoki:', network);
      return;
    }

    console.log('🔧 Registering Enoki wallets for network:', network);

    const { unregister } = registerEnokiWallets({
      apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
      providers: {
        google: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          redirectUrl: process.env.NEXT_PUBLIC_REDIRECT_URI!,
        },
      },
      client,
      network,
    });

    console.log('✅ Enoki wallets registered successfully');

    return unregister;
  }, [client, network]);

  return null;
}