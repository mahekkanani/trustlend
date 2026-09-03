// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReputationScore.sol";

/// @title LendingPool
/// @notice Main lending contract that uses reputation scores to determine collateral requirements
/// @dev Integrates with ReputationScore contract and Chainlink price feeds
contract LendingPool is Ownable {

    // ========== STATE VARIABLES ==========

    /// @notice Reference to the reputation scoring contract
    ReputationScore public reputationScore;

    /// @notice The ERC20 token users can borrow (e.g., DAI, USDC)
    IERC20 public lendingToken;

    /// @notice Fixed ETH price in USD (in production, use Chainlink oracle)
    /// @dev For hackathon demo: 1 ETH = $2000. Format: price * 1e18
    uint256 public ethPriceUSD = 2000 * 1e18;

    // ========== COLLATERAL TIER CONSTANTS ==========

    /// @notice Collateral requirement for score 0 (new users)
    uint256 public constant COLLATERAL_TIER_0 = 150; // 150%

    /// @notice Collateral requirement for score 25 (1 repayment)
    uint256 public constant COLLATERAL_TIER_1 = 130; // 130%

    /// @notice Collateral requirement for score 50 (2 repayments)
    uint256 public constant COLLATERAL_TIER_2 = 115; // 115%

    /// @notice Collateral requirement for score 75+ (3+ repayments)
    uint256 public constant COLLATERAL_TIER_3 = 90;  // 90%

    // ========== STRUCTS ==========

    /// @notice Represents an active loan
    struct Loan {
        uint256 collateralAmount; // ETH deposited as collateral
        uint256 borrowedAmount;   // Tokens borrowed
        uint256 timestamp;        // When the loan was taken
    }

    // ========== MAPPINGS ==========

    /// @notice Mapping of user addresses to their active loans
    mapping(address => Loan) public loans;

    // ========== EVENTS ==========

    /// @notice Emitted when a user takes a loan
    event LoanTaken(
        address indexed user,
        uint256 borrowedAmount,
        uint256 collateralAmount,
        uint256 collateralRequirement
    );

    /// @notice Emitted when a user repays their loan
    event LoanRepaid(
        address indexed user,
        uint256 amount,
        uint256 newScore
    );

    /// @notice Emitted when a loan is liquidated
    event Liquidated(
        address indexed user,
        uint256 collateralSeized
    );

    /// @notice Emitted when ETH price is updated (admin function)
    event EthPriceUpdated(uint256 newPrice);

    // ========== CONSTRUCTOR ==========

    /// @notice Initialize the lending pool
    /// @param _reputationScore Address of the ReputationScore contract
    /// @param _lendingToken Address of the ERC20 token to lend (e.g., DAI)
    constructor(
        address _reputationScore,
        address _lendingToken
    ) Ownable(msg.sender) {
        require(_reputationScore != address(0), "Invalid reputation address");
        require(_lendingToken != address(0), "Invalid token address");

        reputationScore = ReputationScore(_reputationScore);
        lendingToken = IERC20(_lendingToken);
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Update ETH price manually (in production, use Chainlink oracle)
    /// @param _priceUSD New ETH price in USD (with 18 decimals)
    function setEthPrice(uint256 _priceUSD) external onlyOwner {
        require(_priceUSD > 0, "Invalid price");
        ethPriceUSD = _priceUSD;
        emit EthPriceUpdated(_priceUSD);
    }

    /// @notice Owner can deposit lending tokens into the pool
    /// @param amount Amount of tokens to deposit
    function depositLendingTokens(uint256 amount) external onlyOwner {
        require(
            lendingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }

    // ========== CORE LENDING FUNCTIONS ==========

    /// @notice Calculate required collateral percentage based on user's reputation score
    /// @param user Address of the borrower
    /// @return Collateral requirement as a percentage (90-150)
    function getCollateralRequirement(address user) public view returns (uint256) {
        uint256 score = reputationScore.getScore(user);

        if (score >= 75) return COLLATERAL_TIER_3; // 90%
        if (score >= 50) return COLLATERAL_TIER_2; // 115%
        if (score >= 25) return COLLATERAL_TIER_1; // 130%
        return COLLATERAL_TIER_0; // 150%
    }

    /// @notice Get current ETH price in USD
    /// @return ETH price with 18 decimals
    function getEthPrice() public view returns (uint256) {
        return ethPriceUSD;
    }

    /// @notice Borrow tokens by depositing ETH collateral
    /// @param borrowAmount Amount of tokens to borrow
    function borrow(uint256 borrowAmount) external payable {
        require(msg.value > 0, "Must deposit collateral");
        require(borrowAmount > 0, "Must borrow non-zero amount");
        require(loans[msg.sender].borrowedAmount == 0, "Already have active loan");

        // Get user's collateral requirement based on their score
        uint256 collateralRequirement = getCollateralRequirement(msg.sender);

        // Calculate collateral value in USD
        // msg.value is in wei (18 decimals), ethPriceUSD has 18 decimals
        // collateralValue = (ETH amount * ETH price) / 1e18
        uint256 collateralValueUSD = (msg.value * ethPriceUSD) / 1e18;

        // Calculate required collateral in USD
        // If borrowing 100 tokens and requirement is 150%, need $150 worth of collateral
        // Assuming lending token has 18 decimals (like DAI)
        uint256 requiredCollateralUSD = (borrowAmount * collateralRequirement) / 100;

        require(
            collateralValueUSD >= requiredCollateralUSD,
            "Insufficient collateral"
        );

        // Record the loan
        loans[msg.sender] = Loan({
            collateralAmount: msg.value,
            borrowedAmount: borrowAmount,
            timestamp: block.timestamp
        });

        // Transfer tokens to borrower
        require(
            lendingToken.transfer(msg.sender, borrowAmount),
            "Token transfer failed"
        );

        emit LoanTaken(msg.sender, borrowAmount, msg.value, collateralRequirement);
    }

    /// @notice Repay loan and get collateral back
    function repay() external {
        Loan memory loan = loans[msg.sender];
        require(loan.borrowedAmount > 0, "No active loan");

        uint256 amountToRepay = loan.borrowedAmount;
        uint256 collateralToReturn = loan.collateralAmount;

        // Transfer tokens back from borrower
        require(
            lendingToken.transferFrom(msg.sender, address(this), amountToRepay),
            "Repayment failed"
        );

        // Clear loan data BEFORE external calls (reentrancy protection)
        delete loans[msg.sender];

        // Increase reputation score
        reputationScore.increaseScore(msg.sender);
        uint256 newScore = reputationScore.getScore(msg.sender);

        // Return collateral to borrower
        (bool success, ) = msg.sender.call{value: collateralToReturn}("");
        require(success, "ETH transfer failed");

        emit LoanRepaid(msg.sender, amountToRepay, newScore);
    }

    /// @notice Liquidate an undercollateralized loan
    /// @param user Address of the borrower to liquidate
    function liquidate(address user) external {
        Loan memory loan = loans[user];
        require(loan.borrowedAmount > 0, "No active loan");

        // Check if loan is undercollateralized
        uint256 collateralRequirement = getCollateralRequirement(user);
        uint256 currentCollateralValue = (loan.collateralAmount * ethPriceUSD) / 1e18;
        uint256 requiredCollateral = (loan.borrowedAmount * collateralRequirement) / 100;

        require(
            currentCollateralValue < requiredCollateral,
            "Loan not liquidatable"
        );

        // Seize collateral
        uint256 collateralSeized = loan.collateralAmount;

        // Clear loan data
        delete loans[user];

        // Reset reputation to 0
        reputationScore.resetScore(user);

        // In production: transfer collateral to liquidator or protocol
        // For demo: collateral stays in contract

        emit Liquidated(user, collateralSeized);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get loan details for a user
    /// @param user Address of the borrower
    /// @return Loan struct containing collateral, borrowed amount, and timestamp
    function getLoan(address user) external view returns (Loan memory) {
        return loans[user];
    }

    /// @notice Check if a loan is eligible for liquidation
    /// @param user Address of the borrower
    /// @return True if the loan can be liquidated
    function isLiquidatable(address user) external view returns (bool) {
        Loan memory loan = loans[user];
        if (loan.borrowedAmount == 0) return false;

        uint256 collateralRequirement = getCollateralRequirement(user);
        uint256 currentCollateralValue = (loan.collateralAmount * ethPriceUSD) / 1e18;
        uint256 requiredCollateral = (loan.borrowedAmount * collateralRequirement) / 100;

        return currentCollateralValue < requiredCollateral;
    }

    // ========== FALLBACK ==========

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}