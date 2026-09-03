// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationScore
/// @notice Tracks credit scores (0-100) for borrowers based on repayment history
/// @dev Only the LendingPool contract can update scores
contract ReputationScore is Ownable {

    // ========== STATE VARIABLES ==========

    /// @notice Mapping of user addresses to their credit scores
    mapping(address => uint256) private scores;

    /// @notice Address of the lending pool contract (only address allowed to update scores)
    address public lendingPool;

    // ========== CONSTANTS ==========

    /// @notice Maximum possible score
    uint256 public constant MAX_SCORE = 100;

    /// @notice Score increase per successful repayment
    uint256 public constant SCORE_INCREMENT = 25;

    // ========== EVENTS ==========

    /// @notice Emitted when a user's score is updated
    event ScoreUpdated(address indexed user, uint256 newScore);

    /// @notice Emitted when the lending pool address is set
    event LendingPoolSet(address indexed lendingPool);

    // ========== CONSTRUCTOR ==========

    /// @notice Initialize the contract and set the deployer as owner
    constructor() Ownable(msg.sender) {}

    // ========== MODIFIERS ==========

    /// @notice Restrict function access to only the lending pool
    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "Only lending pool can call");
        _;
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Set the lending pool address (only owner can call)
    /// @param _lendingPool Address of the lending pool contract
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "Invalid address");
        lendingPool = _lendingPool;
        emit LendingPoolSet(_lendingPool);
    }

    // ========== CORE FUNCTIONS ==========

    /// @notice Increase a user's score after successful repayment
    /// @param user Address of the borrower
    /// @dev Can only be called by the lending pool contract
    function increaseScore(address user) external onlyLendingPool {
        uint256 currentScore = scores[user];
        uint256 newScore = currentScore + SCORE_INCREMENT;

        // Cap score at maximum
        if (newScore > MAX_SCORE) {
            newScore = MAX_SCORE;
        }

        scores[user] = newScore;
        emit ScoreUpdated(user, newScore);
    }

    /// @notice Reset a user's score to 0 (called on liquidation)
    /// @param user Address of the borrower
    /// @dev Can only be called by the lending pool contract
    function resetScore(address user) external onlyLendingPool {
        scores[user] = 0;
        emit ScoreUpdated(user, 0);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get a user's current credit score
    /// @param user Address of the borrower
    /// @return The user's score (0-100)
    function getScore(address user) external view returns (uint256) {
        return scores[user];
    }
}