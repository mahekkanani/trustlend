// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {MockDAI} from "../src/MockDAI.sol";

contract FundPool is Script {
    function run() external {
        address payable lendingPool = payable(vm.envAddress("LENDING_POOL"));
        address mockDai = vm.envAddress("MOCK_DAI");

        vm.startBroadcast();

        MockDAI dai = MockDAI(mockDai);

        // Mint 100,000 DAI to deployer
        dai.mint(msg.sender, 100_000 ether);

        // Approve LendingPool to spend the deployer's DAI
        dai.approve(lendingPool, type(uint256).max);

        // Deposit 100,000 DAI into LendingPool
        LendingPool(lendingPool).depositLendingTokens(100_000 ether);

        vm.stopBroadcast();

        console2.log("=== TrustLend Pool Funding Complete ===");
        console2.log("Pool funded with 100,000 DAI");
        console2.log(
            "Available liquidity:",
            LendingPool(lendingPool).availableEth()
        );
    }
}