// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {ReputationScore} from "./ReputationScore.sol";

/// @title LendingPool
/// @notice ETH-collateralized lending pool with reputation-based collateral tiers.
/// @dev The lending token is assumed to be USD-pegged; ETH/USD comes from a Chainlink Data Feed.
contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ========== STATE VARIABLES ==========

    /// @notice Reference to the reputation scoring contract.
    ReputationScore public immutable reputationScore;

    /// @notice USD-pegged ERC20 token users can borrow.
    IERC20 public immutable lendingToken;

    /// @notice Chainlink ETH/USD price feed.
    AggregatorV3Interface public immutable priceFeed;

    /// @notice Decimals used by the lending token.
    uint8 public immutable lendingTokenDecimals;

    /// @notice ETH currently backing active loans.
    uint256 public totalActiveCollateral;

    // ========== CONSTANTS ==========

    /// @notice How long a borrower has to repay a loan.
    uint256 public constant LOAN_DURATION = 7 days;

    /// @notice Maximum age accepted for oracle data.
    uint256 public constant MAX_PRICE_STALENESS = 1 days;

    /// @notice Collateral requirement for score 0.
    uint256 public constant COLLATERAL_TIER_0 = 150;

    /// @notice Collateral requirement for score 25.
    uint256 public constant COLLATERAL_TIER_1 = 130;

    /// @notice Collateral requirement for score 50.
    uint256 public constant COLLATERAL_TIER_2 = 115;

    /// @notice Collateral requirement for score 75+.
    uint256 public constant COLLATERAL_TIER_3 = 90;

    // ========== STRUCTS ==========

    /// @notice Represents an active loan.
    struct Loan {
        uint256 collateralAmount; // ETH deposited
        uint256 borrowedAmount; // Lending token amount
        uint256 timestamp; // Loan creation timestamp
    }

    // ========== MAPPINGS ==========

    /// @notice User address => active loan.
    mapping(address => Loan) public loans;

    // ========== EVENTS ==========

    event LoanTaken(
        address indexed user,
        uint256 borrowedAmount,
        uint256 collateralAmount,
        uint256 collateralRequirement,
        uint256 repaymentDeadline
    );

    event LoanRepaid(address indexed user, uint256 amount, uint256 newScore);
    event Liquidated(address indexed user, uint256 collateralSeized);
    event EthWithdrawn(address indexed recipient, uint256 amount);

    // ========== CONSTRUCTOR ==========

    /// @notice Initialize the lending pool.
    /// @param _reputationScore ReputationScore contract address.
    /// @param _lendingToken USD-pegged ERC20 lending token address.
    /// @param _priceFeed Chainlink ETH/USD feed address.
    constructor(address _reputationScore, address _lendingToken, address _priceFeed) Ownable(msg.sender) {
        require(_reputationScore != address(0), "Invalid reputation address");
        require(_lendingToken != address(0), "Invalid token address");
        require(_priceFeed != address(0), "Invalid price feed");

        uint8 tokenDecimals = IERC20Metadata(_lendingToken).decimals();
        require(tokenDecimals <= 18, "Token decimals too high");

        uint8 feedDecimals = AggregatorV3Interface(_priceFeed).decimals();
        require(feedDecimals <= 18, "Price decimals too high");

        reputationScore = ReputationScore(_reputationScore);
        lendingToken = IERC20(_lendingToken);
        lendingTokenDecimals = tokenDecimals;
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Deposit lending tokens into the pool.
    /// @dev Owner must approve this contract before calling.
    function depositLendingTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        lendingToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice Withdraw ETH that is not reserved for active loans.
    /// @dev This can withdraw seized collateral or ETH sent directly to the contract.
    function withdrawAvailableEth(address payable recipient, uint256 amount) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= availableEth(), "Amount exceeds available ETH");

        (bool success,) = recipient.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit EthWithdrawn(recipient, amount);
    }

    // ========== PRICE FUNCTIONS ==========

    /// @notice Get current ETH/USD price from Chainlink.
    /// @return ETH price normalized to 18 decimals.
    function getEthPrice() public view returns (uint256) {
        (uint80 roundId, int256 answer,, uint256 updatedAt, uint80 answeredInRound) = priceFeed.latestRoundData();

        require(answer > 0, "Invalid price");
        require(updatedAt > 0, "Stale price");
        require(updatedAt <= block.timestamp, "Invalid price timestamp");
        require(answeredInRound >= roundId, "Stale price");
        require(block.timestamp - updatedAt <= MAX_PRICE_STALENESS, "Stale price");

        uint8 feedDecimals = priceFeed.decimals();
        require(feedDecimals <= 18, "Price decimals too high");

        return uint256(answer) * (10 ** (18 - feedDecimals));
    }

    // ========== COLLATERAL FUNCTIONS ==========

    /// @notice Calculate required collateral percentage from reputation.
    /// @param user Borrower address.
    /// @return Collateral percentage (90-150).
    function getCollateralRequirement(address user) public view returns (uint256) {
        uint256 score = reputationScore.getScore(user);

        if (score >= 75) {
            return COLLATERAL_TIER_3;
        }

        if (score >= 50) {
            return COLLATERAL_TIER_2;
        }

        if (score >= 25) {
            return COLLATERAL_TIER_1;
        }

        return COLLATERAL_TIER_0;
    }

    /// @notice Calculate the USD value of ETH collateral using the latest oracle price.
    /// @return USD value normalized to 18 decimals.
    function getCollateralValueUSD(uint256 ethAmount) public view returns (uint256) {
        return (ethAmount * getEthPrice()) / 1e18;
    }

    /// @notice Calculate the required USD collateral for a borrow amount.
    /// @return Required collateral value normalized to 18 decimals.
    function getRequiredCollateralValueUSD(address user, uint256 borrowAmount) public view returns (uint256) {
        uint256 borrowValueUSD = _normalizeTokenAmount(borrowAmount);
        return (borrowValueUSD * getCollateralRequirement(user)) / 100;
    }

    /// @notice ETH that can be withdrawn without touching active loan collateral.
    function availableEth() public view returns (uint256) {
        return address(this).balance - totalActiveCollateral;
    }

    /// @notice Get the deadline for a user's active loan.
    function getRepaymentDeadline(address user) public view returns (uint256) {
        Loan memory loan = loans[user];

        if (loan.borrowedAmount == 0) {
            return 0;
        }

        return loan.timestamp + LOAN_DURATION;
    }

    /// @notice Check whether a user's loan is overdue.
    function isOverdue(address user) public view returns (bool) {
        Loan memory loan = loans[user];

        if (loan.borrowedAmount == 0) {
            return false;
        }

        return block.timestamp > loan.timestamp + LOAN_DURATION;
    }

    // ========== CORE LENDING FUNCTIONS ==========

    /// @notice Borrow lending tokens by depositing ETH collateral.
    /// @param borrowAmount Amount of ERC20 tokens to borrow.
    function borrow(uint256 borrowAmount) external payable nonReentrant {
        require(msg.value > 0, "Must deposit collateral");
        require(borrowAmount > 0, "Must borrow non-zero amount");
        require(loans[msg.sender].borrowedAmount == 0, "Already have active loan");
        require(lendingToken.balanceOf(address(this)) >= borrowAmount, "Insufficient pool liquidity");

        uint256 collateralRequirement = getCollateralRequirement(msg.sender);
        uint256 collateralValueUSD = getCollateralValueUSD(msg.value);
        uint256 requiredCollateralUSD = getRequiredCollateralValueUSD(msg.sender, borrowAmount);

        require(collateralValueUSD >= requiredCollateralUSD, "Insufficient collateral");

        uint256 repaymentDeadline = block.timestamp + LOAN_DURATION;

        loans[msg.sender] =
            Loan({collateralAmount: msg.value, borrowedAmount: borrowAmount, timestamp: block.timestamp});
        totalActiveCollateral += msg.value;

        lendingToken.safeTransfer(msg.sender, borrowAmount);

        emit LoanTaken(msg.sender, borrowAmount, msg.value, collateralRequirement, repaymentDeadline);
    }

    /// @notice Repay an active loan on time and receive collateral back.
    function repay() external nonReentrant {
        Loan memory loan = loans[msg.sender];

        require(loan.borrowedAmount > 0, "No active loan");
        require(block.timestamp <= loan.timestamp + LOAN_DURATION, "Loan overdue - liquidate");

        uint256 amountToRepay = loan.borrowedAmount;
        uint256 collateralToReturn = loan.collateralAmount;

        delete loans[msg.sender];
        totalActiveCollateral -= collateralToReturn;

        lendingToken.safeTransferFrom(msg.sender, address(this), amountToRepay);
        reputationScore.increaseScore(msg.sender);

        uint256 newScore = reputationScore.getScore(msg.sender);

        (bool success,) = msg.sender.call{value: collateralToReturn}("");
        require(success, "ETH transfer failed");

        emit LoanRepaid(msg.sender, amountToRepay, newScore);
    }

    /// @notice Liquidate an overdue or undercollateralized loan.
    /// @param user Borrower to liquidate.
    function liquidate(address user) external nonReentrant {
        Loan memory loan = loans[user];

        require(loan.borrowedAmount > 0, "No active loan");
        require(_isLiquidatable(loan, user), "Loan not liquidatable");

        uint256 collateralSeized = loan.collateralAmount;

        delete loans[user];
        totalActiveCollateral -= collateralSeized;

        reputationScore.resetScore(user);

        emit Liquidated(user, collateralSeized);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get loan details.
    function getLoan(address user) external view returns (Loan memory) {
        return loans[user];
    }

    /// @notice Check whether loan can currently be liquidated.
    function isLiquidatable(address user) external view returns (bool) {
        Loan memory loan = loans[user];

        if (loan.borrowedAmount == 0) {
            return false;
        }

        return _isLiquidatable(loan, user);
    }

    // ========== INTERNAL FUNCTIONS ==========

    function _normalizeTokenAmount(uint256 amount) internal view returns (uint256) {
        if (lendingTokenDecimals == 18) {
            return amount;
        }

        return amount * (10 ** (18 - lendingTokenDecimals));
    }

    function _isLiquidatable(Loan memory loan, address user) internal view returns (bool) {
        if (block.timestamp > loan.timestamp + LOAN_DURATION) {
            return true;
        }

        uint256 currentCollateralValue = getCollateralValueUSD(loan.collateralAmount);
        uint256 requiredCollateral = getRequiredCollateralValueUSD(user, loan.borrowedAmount);

        return currentCollateralValue < requiredCollateral;
    }

    // ========== FALLBACK ==========

    /// @notice Allow contract to receive ETH.
    receive() external payable {}
}
