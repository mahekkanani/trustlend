# TrustLend Frontend

Premium Web3 frontend for the TrustLend reputation-powered lending protocol.

## Overview

TrustLend is a DeFi lending protocol where your on-chain repayment history improves your borrowing terms. The more responsibly you borrow and repay, the lower your collateral requirements become.

**Credit Tiers:**
- Score 0-24: 150% collateral (NEW)
- Score 25-49: 130% collateral (BASIC)
- Score 50-74: 115% collateral (TRUSTED)
- Score 75-100: 90% collateral (ESTABLISHED)

Every successful on-time repayment increases your score by 25 points.

## Tech Stack

- **React** — UI framework
- **Vite** — Build tool
- **Wagmi v2** — Web3 React hooks
- **Viem** — Ethereum interactions
- **TanStack Query** — Async state management
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Lucide React** — Icons

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your deployed contract addresses:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_LENDING_POOL_ADDRESS=0x...
VITE_REPUTATION_SCORE_ADDRESS=0x...
VITE_MOCK_DAI_ADDRESS=0x...
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
```

### 3. Deploy Contracts (if not already deployed)

From the project root:

```bash
# Start local Anvil node
anvil

# In another terminal, deploy contracts
forge script script/DeployTrustLend.s.sol:DeployTrustLend --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

# The deployment will output contract addresses — copy them to .env
```

### 4. Fund the Pool (owner only)

The deployed LendingPool needs liquidity. Using the deployer account:

```bash
# Mint DAI to yourself (MockDAI allows anyone to mint)
cast send $VITE_MOCK_DAI_ADDRESS "mint(address,uint256)" YOUR_ADDRESS 100000000000000000000000 --rpc-url http://127.0.0.1:8545 --private-key YOUR_KEY

# Approve LendingPool to spend DAI
cast send $VITE_MOCK_DAI_ADDRESS "approve(address,uint256)" $VITE_LENDING_POOL_ADDRESS 100000000000000000000000 --rpc-url http://127.0.0.1:8545 --private-key YOUR_KEY

# Deposit liquidity
cast send $VITE_LENDING_POOL_ADDRESS "depositLendingTokens(uint256)" 100000000000000000000000 --rpc-url http://127.0.0.1:8545 --private-key YOUR_KEY
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Connect Wallet

1. Click **CONNECT WALLET** on the landing page
2. Approve the connection in MetaMask (or your preferred wallet)
3. You'll be redirected to the Dashboard

### Borrow DAI

1. On the Dashboard, enter the amount of DAI you want to borrow
2. The configurator calculates required ETH collateral based on:
   - Your current credit score
   - Live ETH/USD price from Chainlink oracle
3. Click **BORROW DAI** and approve the transaction
4. Your loan appears as an active position

### Repay Loan

1. When you have an active loan, the **Repay** section appears
2. If needed, the UI will request DAI approval first
3. Click **REPAY LOAN** to return borrowed DAI
4. Your collateral is returned and your credit score increases by 25

### Build Reputation

- Start at score 0 (150% collateral)
- Each on-time repayment: +25 score
- After 3 repayments: reach 75 score (90% collateral tier)
- Liquidation resets score to 0

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── ActiveLoan.jsx        # Active loan display + repay
│   │   ├── BackgroundFX.jsx      # Animated background
│   │   ├── BorrowConfigurator.jsx # Borrow amount input + calculations
│   │   ├── CreditPassport.jsx    # Main credit passport card
│   │   ├── CreditScore.jsx       # Animated score ring
│   │   ├── CreditTiers.jsx       # Tier visualization
│   │   ├── Navbar.jsx            # Top navigation
│   │   ├── OracleStatus.jsx      # ETH/USD price feed status
│   │   ├── Toast.jsx             # Toast notifications
│   │   └── WalletButton.jsx      # Wallet connection button
│   ├── config/
│   │   ├── contracts.js   # Contract addresses + constants
│   │   └── wagmi.js       # Wagmi configuration
│   ├── contracts/
│   │   └── abis.js        # Contract ABIs (from Foundry)
│   ├── hooks/
│   │   ├── useCreditScore.js  # Read reputation score
│   │   ├── useEthPrice.js     # Read oracle price
│   │   └── useLoan.js         # Read loan state
│   ├── pages/
│   │   ├── Dashboard.jsx  # Main app dashboard
│   │   └── Landing.jsx    # Landing page
│   ├── utils/
│   │   ├── calculations.js # Collateral calculations
│   │   └── format.js       # Formatting helpers
│   ├── App.jsx            # Root component
│   ├── index.css          # Global styles
│   └── main.jsx           # Entry point
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Contract Integration

The frontend reads from and writes to three smart contracts:

### LendingPool

**Reads:**
- `getCollateralRequirement(address)` — current collateral % for user
- `getLoan(address)` — active loan details
- `getRepaymentDeadline(address)` — loan deadline timestamp
- `getEthPrice()` — current ETH/USD price from Chainlink
- `isOverdue(address)` — whether loan is past deadline
- `isLiquidatable(address)` — whether loan can be liquidated

**Writes:**
- `borrow(uint256 borrowAmount) payable` — open a new loan
- `repay()` — close active loan (requires DAI approval)

### ReputationScore

**Reads:**
- `getScore(address)` — user's credit score (0-100)

### MockDAI (ERC20)

**Reads:**
- `balanceOf(address)` — user's DAI balance
- `allowance(address owner, address spender)` — approved amount

**Writes:**
- `approve(address spender, uint256 amount)` — approve LendingPool to spend DAI

## Development Notes

- **No TypeScript** — Pure JavaScript for simplicity
- **ABIs from Foundry** — Extracted directly from `out/` build artifacts
- **Environment Variables** — Never commit `.env` (contains addresses)
- **Wagmi v2** — Uses latest hooks (`useReadContract`, `useWriteContract`)
- **Real blockchain state** — No fake/mocked data
- **Responsive** — Mobile-friendly but optimized for desktop demos

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static hosting (Vercel, Netlify, IPFS, etc.).

## Troubleshooting

### "Contract Addresses Not Configured"

You need to create a `.env` file with deployed contract addresses. See step 2 above.

### "Wrong Network"

Your wallet is connected to a different chain than configured. Switch to the correct network in MetaMask.

### "Insufficient pool liquidity"

The LendingPool doesn't have enough DAI. The owner needs to deposit liquidity (see step 4).

### Transactions fail silently

Check:
1. Are you on the correct network?
2. Do you have enough ETH for gas?
3. For repayment: Do you have enough DAI?
4. Check the browser console for detailed errors

### Oracle shows "Stale price"

The Chainlink mock hasn't been updated recently. On a local node, the timestamp might be frozen. This is expected behavior for testing.

## License

MIT

## Contact

Built for the TrustLend protocol — a hackathon-style MVP demonstrating reputation-based DeFi lending.
