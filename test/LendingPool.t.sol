// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MockV3Aggregator} from "@chainlink/contracts/src/v0.8/shared/mocks/MockV3Aggregator.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {MockDAI} from "../src/MockDAI.sol";
import {ReputationScore} from "../src/ReputationScore.sol";

contract LendingPoolTest is Test {
    uint256 private constant POOL_LIQUIDITY = 100_000 ether;
    uint256 private constant BORROW_AMOUNT = 100 ether;
    uint256 private constant ETH_USD_PRICE = 2_000e8;
    uint256 private constant BORROWER_INITIAL_ETH = 10 ether;

    address private borrower = address(0xB0B);
    address private liquidator = address(0x1EAF);

    ReputationScore private reputationScore;
    MockDAI private dai;
    MockV3Aggregator private priceFeed;
    LendingPool private lendingPool;

    function setUp() public {
        reputationScore = new ReputationScore();
        dai = new MockDAI();
        priceFeed = new MockV3Aggregator(8, int256(ETH_USD_PRICE));
        lendingPool = new LendingPool(address(reputationScore), address(dai), address(priceFeed));

        reputationScore.setLendingPool(address(lendingPool));
        dai.approve(address(lendingPool), POOL_LIQUIDITY);
        lendingPool.depositLendingTokens(POOL_LIQUIDITY);

        vm.deal(borrower, BORROWER_INITIAL_ETH);
        vm.deal(liquidator, 1 ether);
    }

    function testOwnerCanDepositLendingTokens() public view {
        assertEq(dai.balanceOf(address(lendingPool)), POOL_LIQUIDITY);
    }

    function testReadsOraclePriceWithEighteenDecimals() public view {
        assertEq(lendingPool.getEthPrice(), 2_000 ether);
    }

    function testBorrowCreatesLoanAndTransfersTokens() public {
        _borrow(BORROW_AMOUNT, 0.075 ether);

        LendingPool.Loan memory loan = lendingPool.getLoan(borrower);
        assertEq(loan.collateralAmount, 0.075 ether);
        assertEq(loan.borrowedAmount, BORROW_AMOUNT);
        assertEq(dai.balanceOf(borrower), BORROW_AMOUNT);
        assertEq(lendingPool.totalActiveCollateral(), 0.075 ether);
        assertEq(lendingPool.getRepaymentDeadline(borrower), loan.timestamp + lendingPool.LOAN_DURATION());
    }

    function testBorrowRevertsWhenCollateralIsTooLow() public {
        vm.prank(borrower);
        vm.expectRevert("Insufficient collateral");
        lendingPool.borrow{value: 0.074 ether}(BORROW_AMOUNT);
    }

    function testRepayReturnsCollateralAndIncreasesScore() public {
        _borrow(BORROW_AMOUNT, 0.075 ether);

        vm.startPrank(borrower);
        dai.approve(address(lendingPool), BORROW_AMOUNT);
        lendingPool.repay();
        vm.stopPrank();

        LendingPool.Loan memory loan = lendingPool.getLoan(borrower);
        assertEq(loan.borrowedAmount, 0);
        assertEq(reputationScore.getScore(borrower), 25);
        assertEq(lendingPool.totalActiveCollateral(), 0);
        assertEq(dai.balanceOf(address(lendingPool)), POOL_LIQUIDITY);
    }

    function testRepaymentScoreCapsAtOneHundredAndImprovesCollateralTier() public {
        assertEq(lendingPool.getCollateralRequirement(borrower), 150);

        _borrowAndRepay(0.075 ether);
        assertEq(reputationScore.getScore(borrower), 25);
        assertEq(lendingPool.getCollateralRequirement(borrower), 130);

        _borrowAndRepay(0.065 ether);
        assertEq(reputationScore.getScore(borrower), 50);
        assertEq(lendingPool.getCollateralRequirement(borrower), 115);

        _borrowAndRepay(0.0575 ether);
        assertEq(reputationScore.getScore(borrower), 75);
        assertEq(lendingPool.getCollateralRequirement(borrower), 90);

        _borrowAndRepay(0.045 ether);
        _borrowAndRepay(0.045 ether);
        assertEq(reputationScore.getScore(borrower), 100);
        assertEq(lendingPool.getCollateralRequirement(borrower), 90);
    }

    function testOverdueLoanCanBeLiquidatedAndResetsScore() public {
        _borrowAndRepay(0.075 ether);
        _borrow(BORROW_AMOUNT, 0.065 ether);

        vm.warp(block.timestamp + lendingPool.LOAN_DURATION() + 1);

        assertTrue(lendingPool.isOverdue(borrower));
        assertTrue(lendingPool.isLiquidatable(borrower));

        vm.prank(liquidator);
        lendingPool.liquidate(borrower);

        LendingPool.Loan memory loan = lendingPool.getLoan(borrower);
        assertEq(loan.borrowedAmount, 0);
        assertEq(reputationScore.getScore(borrower), 0);
        assertEq(lendingPool.totalActiveCollateral(), 0);
        assertEq(lendingPool.availableEth(), 0.065 ether);
    }

    function testUndercollateralizedLoanCanBeLiquidatedAfterPriceDrop() public {
        _borrow(BORROW_AMOUNT, 0.075 ether);

        priceFeed.updateAnswer(1_000e8);

        assertTrue(lendingPool.isLiquidatable(borrower));

        vm.prank(liquidator);
        lendingPool.liquidate(borrower);

        LendingPool.Loan memory loan = lendingPool.getLoan(borrower);
        assertEq(loan.borrowedAmount, 0);
        assertEq(lendingPool.availableEth(), 0.075 ether);
    }

    function testOnTimeLoanCannotBeLiquidated() public {
        _borrow(BORROW_AMOUNT, 0.075 ether);

        vm.prank(liquidator);
        vm.expectRevert("Loan not liquidatable");
        lendingPool.liquidate(borrower);
    }

    function testOwnerCanWithdrawOnlyAvailableEth() public {
        _borrow(BORROW_AMOUNT, 0.075 ether);

        vm.expectRevert("Amount exceeds available ETH");
        lendingPool.withdrawAvailableEth(payable(address(this)), 1);

        vm.warp(block.timestamp + lendingPool.LOAN_DURATION() + 1);
        vm.prank(liquidator);
        lendingPool.liquidate(borrower);

        uint256 beforeBalance = address(this).balance;
        lendingPool.withdrawAvailableEth(payable(address(this)), 0.075 ether);

        assertEq(address(this).balance, beforeBalance + 0.075 ether);
        assertEq(lendingPool.availableEth(), 0);
    }

    function testOracleRejectsStalePrice() public {
        vm.warp(block.timestamp + lendingPool.MAX_PRICE_STALENESS() + 1);

        vm.expectRevert("Stale price");
        lendingPool.getEthPrice();
    }

    function testOracleRejectsInvalidPrice() public {
        priceFeed.updateAnswer(0);

        vm.expectRevert("Invalid price");
        lendingPool.getEthPrice();
    }

    function testOnlyLendingPoolCanUpdateReputation() public {
        vm.prank(borrower);
        vm.expectRevert("Only lending pool can call");
        reputationScore.increaseScore(borrower);
    }

    function _borrow(uint256 borrowAmount, uint256 collateralAmount) private {
        vm.prank(borrower);
        lendingPool.borrow{value: collateralAmount}(borrowAmount);
    }

    function _borrowAndRepay(uint256 collateralAmount) private {
        _borrow(BORROW_AMOUNT, collateralAmount);

        vm.startPrank(borrower);
        dai.approve(address(lendingPool), BORROW_AMOUNT);
        lendingPool.repay();
        vm.stopPrank();
    }

    receive() external payable {}
}
