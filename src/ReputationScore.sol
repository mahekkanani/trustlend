// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationScore
/// @notice Tracks credit scores (0-100) for borrowers based on repayment history.
/// @dev Only the LendingPool contract can update scores.
contract ReputationScore is Ownable {
    // ========== STATE VARIABLES ==========

    /// @notice Mapping of user addresses to their credit scores.
    mapping(address => uint256) private scores;

    /// @notice Address of the LendingPool contract.
    address public lendingPool;

    // ========== CONSTANTS ==========

    /// @notice Maximum possible score.
    uint256 public constant MAX_SCORE = 100;

    /// @notice Score increase per successful on-time repayment.
    uint256 public constant SCORE_INCREMENT = 25;

    // ========== EVENTS ==========

    event ScoreUpdated(address indexed user, uint256 newScore);
    event LendingPoolSet(address indexed lendingPool);

    // ========== CONSTRUCTOR ==========

    constructor() Ownable(msg.sender) {}

    // ========== MODIFIERS ==========

    /// @notice Restrict score-changing functions to LendingPool.
    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "Only lending pool can call");
        _;
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Set the LendingPool contract address.
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "Invalid address");

        lendingPool = _lendingPool;

        emit LendingPoolSet(_lendingPool);
    }

    // ========== CORE FUNCTIONS ==========

    /// @notice Increase a user's score after an on-time repayment.
    function increaseScore(address user) external onlyLendingPool {
        require(user != address(0), "Invalid user");

        uint256 currentScore = scores[user];
        uint256 newScore = currentScore + SCORE_INCREMENT;

        if (newScore > MAX_SCORE) {
            newScore = MAX_SCORE;
        }

        scores[user] = newScore;

        emit ScoreUpdated(user, newScore);
    }

    /// @notice Reset a user's score after liquidation.
    function resetScore(address user) external onlyLendingPool {
        require(user != address(0), "Invalid user");

        scores[user] = 0;

        emit ScoreUpdated(user, 0);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get a user's credit score.
    function getScore(address user) external view returns (uint256) {
        return scores[user];
    }
}
