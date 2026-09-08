// Contract ABIs extracted from Foundry build artifacts (out/)
// Do NOT edit manually — regenerate with: forge build

export const LENDING_POOL_ABI = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "_reputationScore", "type": "address", "internalType": "address" },
      { "name": "_lendingToken", "type": "address", "internalType": "address" },
      { "name": "_priceFeed", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "nonpayable"
  },
  { "type": "receive", "stateMutability": "payable" },
  {
    "type": "function", "name": "COLLATERAL_TIER_0",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "COLLATERAL_TIER_1",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "COLLATERAL_TIER_2",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "COLLATERAL_TIER_3",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "LOAN_DURATION",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "MAX_PRICE_STALENESS",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "availableEth",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "borrow",
    "inputs": [{ "name": "borrowAmount", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function", "name": "depositLendingTokens",
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "getCollateralRequirement",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "getCollateralValueUSD",
    "inputs": [{ "name": "ethAmount", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "getEthPrice",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "getLoan",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [
      {
        "name": "", "type": "tuple",
        "components": [
          { "name": "collateralAmount", "type": "uint256" },
          { "name": "borrowedAmount", "type": "uint256" },
          { "name": "timestamp", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "getRepaymentDeadline",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "getRequiredCollateralValueUSD",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "borrowAmount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "isLiquidatable",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "isOverdue",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "lendingToken",
    "inputs": [], "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "priceFeed",
    "inputs": [], "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "lendingTokenDecimals",
    "inputs": [], "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "liquidate",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "loans",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [
      { "name": "collateralAmount", "type": "uint256" },
      { "name": "borrowedAmount", "type": "uint256" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "repay",
    "inputs": [], "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "totalActiveCollateral",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "withdrawAvailableEth",
    "inputs": [
      { "name": "recipient", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event", "name": "LoanTaken",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "borrowedAmount", "type": "uint256", "indexed": false },
      { "name": "collateralAmount", "type": "uint256", "indexed": false },
      { "name": "collateralRequirement", "type": "uint256", "indexed": false },
      { "name": "repaymentDeadline", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event", "name": "LoanRepaid",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "newScore", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event", "name": "Liquidated",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "collateralSeized", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  { "type": "error", "name": "ReentrancyGuardReentrantCall", "inputs": [] }
]

export const REPUTATION_SCORE_ABI = [
  {
    "type": "function", "name": "getScore",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "MAX_SCORE",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "SCORE_INCREMENT",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "lendingPool",
    "inputs": [], "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "event", "name": "ScoreUpdated",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "newScore", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  }
]

export const MOCK_DAI_ABI = [
  {
    "type": "function", "name": "allowance",
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "decimals",
    "inputs": [], "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "mint",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "name",
    "inputs": [], "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "symbol",
    "inputs": [], "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "totalSupply",
    "inputs": [], "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event", "name": "Transfer",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event", "name": "Approval",
    "inputs": [
      { "name": "owner", "type": "address", "indexed": true },
      { "name": "spender", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  }
]


// Minimal Chainlink AggregatorV3Interface ABI — only latestRoundData is needed.
// This is the standard Chainlink interface, not a generated artifact.
export const CHAINLINK_FEED_ABI = [
  {
    "type": "function",
    "name": "latestRoundData",
    "inputs": [],
    "outputs": [
      { "name": "roundId",         "type": "uint80"  },
      { "name": "answer",          "type": "int256"  },
      { "name": "startedAt",       "type": "uint256" },
      { "name": "updatedAt",       "type": "uint256" },
      { "name": "answeredInRound", "type": "uint80"  }
    ],
    "stateMutability": "view"
  }
]
