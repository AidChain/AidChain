# AidChain
A Worldwide Distribution of Relief Funds to Beneficiary across the globe.

## Overview
**AidChain** is a global, transparent donation platform built on the **SUI blockchain**, designed to make giving **simple, secure, and trustworthy**. Donors can contribute to charitable initiatives or specific donation drives and **track exactly how their contributions are spent** — all with minimal transaction costs.

---

## Features
- **One-Click Donations** – Simple, user-friendly interface for all donors.
- **Maximum Transparency** – Every donation and spending transaction is recorded on-chain.
- **Targeted Giving** – Donate to charitable initiatives or specific donation drives.
- **SUI-Powered Low Fees** – Reduced costs, enabling more funds to reach recipients.
- **Recipient Prepaid Cards** – Controlled spending with category limits and weekly caps.

---

## Technology Stack
- **Frontend:** Next.js, Chart.js, React Bits, Aceternity UI, Tailwind CSS
- **Donation and Spending Backend:** SUI

---

## How It Works
1. **Donate:** Donors send funds using SUI cryptocurrency.
2. **Smart Contract:** Funds are collected and routed to recipients or causes.
3. **Prepaid Card:** Recipients receive a card with:
   - Spending limit (e.g. $20 USD/week)
   - Merchant/category restrictions
4. **Track Spending:** Donors can verify fund usage anytime via blockchain explorers.

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- SUI CLI installed and configured
- The Graph CLI
- Git

### Environment Variables
```bash
# Walrus Config
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.testnet.walrus.atalma.io
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.testnet.walrus.atalma.io

# Sui Config
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://sui-testnet-rpc.publicnode.com:443

# Contracts Config
NEXT_PUBLIC_DONATION_POOL_PACKAGE_ID=0x57285feae828fd141242e120bc7e0157793800fcb35961e98537533aa440d971
NEXT_PUBLIC_DONATION_POOL_OBJECT_ID=0x8053fe3e61b9f7096dfa3760a330bc208d4507b3ceaddae4fb4e3dd5ee715ee5
NEXT_PUBLIC_ADMIN_CAP_OBJECT=0x690d6a4e2c32e349568269e76f7038fb810f15a4d07f67951af3c46600e3330d
NEXT_PUBLIC_ADMIN_ADDRESS=0x02791ca025fc4168fbe4c2f5f0eb5511e2241618c8c635d27dcdde5b37a40086

NEXT_PUBLIC_GOOGLE_CLIENT_ID=610607200024-ukraiuo5sfe3cgdqa3usikj3mcmjb4d5.apps.googleusercontent.com
NEXT_PUBLIC_REDIRECT_URI=https://aid-chain-green.vercel.app/auth/callback
NEXT_PUBLIC_ENOKI_API_KEY=enoki_private_e232fb43285687d130a1b7e37e0aca85
NEXT_PUBLIC_ENOKI_APP_ID=aidchain
```

### Steps
```bash
# 1. Clone the repository
git clone https://github.com/AidChain/AidChain.git

# 2. Navigate into the project folder
cd aidchain-frontend

# 3. Install dependencies for frontend & backend
npm install

# 4. Create an .env file in the root directory

# 5. Paste the Environment Variables above in the .env file.

# 6. Run frontend
npm run dev
```
