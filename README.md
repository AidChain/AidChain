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

### Steps
```bash
# 1. Clone the repository
git clone https://github.com/AidChain/AidChain.git

# 2. Navigate into the project folder
cd aidchain-frontend

# 3. Install dependencies for frontend & backend
npm install

# 4. Run frontend
npm run dev
