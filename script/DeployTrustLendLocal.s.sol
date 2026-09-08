// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {ReputationScore} from "../src/ReputationScore.sol";
import {MockDAI} from "../src/MockDAI.sol";
import {MockV3Aggregator} from "@chainlink/contracts/src/v0.8/shared/mocks/MockV3Aggregator.sol";

contract DeployTrustLendLocal is Script {
    function run() external returns (ReputationScore reputationScore, LendingPool lendingPool, MockDAI dai, MockV3Aggregator priceFeed) {
        vm.startBroadcast();

        // Deploy MockDAI
        dai = new MockDAI();

        // Deploy MockV3Aggregator (Chainlink price feed mock)
        // 8 decimals, starting price $2000
        priceFeed = new MockV3Aggregator(8, 2000e8);

        // Deploy ReputationScore
        reputationScore = new ReputationScore();

        // Deploy LendingPool
        lendingPool = new LendingPool(
            address(reputationScore),
            address(dai),
            address(priceFeed)
        );

        // Connect ReputationScore to LendingPool
        reputationScore.setLendingPool(address(lendingPool));

        vm.stopBroadcast();

        // Log addresses for frontend configuration
        console2.log("=== TrustLend Deployment Complete ===");
        console2.log("");
        console2.log("MockDAI deployed at:", address(dai));
        console2.log("MockV3Aggregator (ETH/USD) deployed at:", address(priceFeed));
        console2.log("ReputationScore deployed at:", address(reputationScore));
        console2.log("LendingPool deployed at:", address(lendingPool));
        console2.log("");
        console2.log("Copy these to frontend/.env:");
        console2.log("VITE_MOCK_DAI_ADDRESS=%s", address(dai));
        console2.log("VITE_REPUTATION_SCORE_ADDRESS=%s", address(reputationScore));
        console2.log("VITE_LENDING_POOL_ADDRESS=%s", address(lendingPool));
        console2.log("VITE_CHAIN_ID=31337");
        console2.log("VITE_RPC_URL=http://127.0.0.1:8545");
    }
}
