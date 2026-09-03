// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {ReputationScore} from "../src/ReputationScore.sol";

contract DeployTrustLend is Script {
    function run() external returns (ReputationScore reputationScore, LendingPool lendingPool) {
        address lendingToken = vm.envAddress("LENDING_TOKEN");
        address ethUsdPriceFeed = vm.envAddress("ETH_USD_PRICE_FEED");

        vm.startBroadcast();
        reputationScore = new ReputationScore();
        lendingPool = new LendingPool(address(reputationScore), lendingToken, ethUsdPriceFeed);
        reputationScore.setLendingPool(address(lendingPool));
        vm.stopBroadcast();
    }
}
