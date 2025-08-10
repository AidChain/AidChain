'use client'

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ZkLoginProvider } from '@/providers/ZkLoginProvider';
import { WalletProvider } from '@mysten/dapp-kit';
import { SuiClientProvider } from '@mysten/dapp-kit';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 3,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider>
      <WalletProvider>
        <ZkLoginProvider>
          {children}
        </ZkLoginProvider>
      </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}