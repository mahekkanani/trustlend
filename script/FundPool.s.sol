// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {MockDAI} from "../src/MockDAI.sol";

contract FundPool is Script {
    function run() external {
        address lendingPool = vm.envAddress("LENDING_POOL");
        address mockDai = vm.envAddress("MOCK_DAI");

        vm.startBroadcast();

        MockDAI dai = MockDAI(mockDai);

        // Mint 100,000 DAI to deployer
        dai.mint(msg.sender, 100_000 ether);

        // Approve LendingPool
        dai.approve(lendingPool, type(uint256).max);

        // Deposit into pool
        LendingPool(lendingPool).depositLendingTokens(100_000 ether);

        vm.stopBroadcast();

        console2.log("Pool funded with 100,000 DAI");
        console2.log("Available liquidity:", LendingPool(lendingPool).availableEth());
    }
}
