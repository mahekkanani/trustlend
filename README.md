# TrustLend

TrustLend is a Foundry smart contract prototype for ETH-collateralized borrowing with a simple on-chain reputation score. Borrowers repay on time to earn better collateral tiers, while overdue or undercollateralized loans can be liquidated.

## Contracts

- `LendingPool`: accepts ETH collateral, lends a USD-pegged ERC20, checks Chainlink ETH/USD pricing, and handles repayment/liquidation.
- `ReputationScore`: tracks borrower scores from 0 to 100 and only allows the configured lending pool to update them.
- `MockDAI`: test/demo ERC20 used for local development.

## Collateral Tiers

| Reputation score | Collateral required |
| --- | --- |
| 0-24 | 150% |
| 25-49 | 130% |
| 50-74 | 115% |
| 75-100 | 90% |

The lending token is assumed to be USD-pegged. ETH collateral value is read from a Chainlink ETH/USD feed, normalized to 18 decimals, and rejected if the feed returns invalid or stale data.

## Development

```shell
git submodule update --init --recursive
forge build
forge test
forge fmt
```

## Deploy

Set the lending token and Chainlink ETH/USD feed addresses, then run the deployment script:

```shell
$env:LENDING_TOKEN = "0x..."
$env:ETH_USD_PRICE_FEED = "0x..."
forge script script/DeployTrustLend.s.sol:DeployTrustLend --rpc-url <rpc_url> --private-key <private_key> --broadcast
```

After deployment, the script connects `ReputationScore` to the deployed `LendingPool`. The pool owner can deposit lending liquidity with `depositLendingTokens` after approving the pool to spend the ERC20.

## Notes

This is an MVP/hackathon-style lending prototype, not audited production code. Liquidated collateral remains in the protocol balance and can be withdrawn only when it is not reserved for active loans.
