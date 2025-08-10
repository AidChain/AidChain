import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { recipient } = await request.json();
    
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient address required' }, { status: 400 });
    }

    console.log(`Server-side faucet request for: ${recipient}`);

    // Make the faucet request from server-side (no CORS issues)
    const response = await fetch('https://faucet.testnet.sui.io/v2/gas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        FixedAmountRequest: {
          recipient: recipient
        }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Server-side faucet request successful');
      return NextResponse.json({ success: true, data: result });
    } else {
      const errorText = await response.text();
      console.error('❌ Faucet API error:', response.status, errorText);
      
      return NextResponse.json({ 
        success: false, 
        error: errorText,
        status: response.status 
      }, { status: response.status });
    }
  } catch (error) {
    console.error('❌ Server faucet error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}