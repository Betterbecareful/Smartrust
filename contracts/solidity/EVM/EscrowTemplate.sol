// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimplifiedEscrow is Initializable, ReentrancyGuardUpgradeable {
    address public buyer;
    address public freelancer;
    address public token;
    string public escrowId;
    address public disputeAdjudicator;
    bool public inDispute;
    bool public finalized;
    
    // These events will be monitored by the Reactive Smart Contract
    event DisputeRaised(string escrowIdentifier, string reason);
    event EscrowCompleted(string escrowIdentifier);
    
    // Initialization function - replaces constructor for clone pattern
    function initialize(
        address _buyer,
        address _freelancer,
        address _token,
        string memory _escrowId
    ) external initializer {
        require(_buyer != address(0) && _freelancer != address(0), "Invalid addresses");
        require(_token != address(0), "Invalid token address");
        
        // Initialize the ReentrancyGuardUpgradeable
        __ReentrancyGuard_init();
        
        buyer = _buyer;
        freelancer = _freelancer;
        token = _token;
        escrowId = _escrowId;
        inDispute = false;
        finalized = false;
    }
    
    // Allow deposits to the escrow
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(!finalized, "Escrow is finalized");
        
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
    }
    
    // Function to trigger a dispute
    function triggerDispute(string memory reason) external {
        require(msg.sender == buyer || msg.sender == freelancer, "Not authorized");
        require(!inDispute, "Already in dispute");
        require(!finalized, "Escrow already finalized");
        
        inDispute = true;
        emit DisputeRaised(escrowId, reason);
    }
    
    // Function called by the RSC to set the adjudicator
    function setAdjudicator(address _adjudicator) external {
        require(inDispute, "No active dispute");
        require(!finalized, "Already finalized");
        require(disputeAdjudicator == address(0), "Adjudicator already set");
        require(_adjudicator != address(0), "Invalid adjudicator address");
        
        disputeAdjudicator = _adjudicator;
    }
    
    // Function called by the adjudicator to finalize the dispute
    function finalizeDispute(uint256 fixedFee, uint256 payoutBasisPoints) external nonReentrant {
        require(inDispute, "No active dispute");
        require(!finalized, "Already finalized");
        require(msg.sender == disputeAdjudicator, "Only adjudicator can finalize");
        require(payoutBasisPoints <= 10000, "Invalid basis points");
        
        // Get balance of tokens in the escrow
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > fixedFee, "Insufficient funds for fee");
        
        // Calculate payouts
        uint256 remainingAfterFee = balance - fixedFee;
        uint256 freelancerShare = (remainingAfterFee * payoutBasisPoints) / 10000;
        uint256 buyerShare = remainingAfterFee - freelancerShare;
        
        // Process fee
        if (fixedFee > 0) {
            // In a real implementation, you would send this to a fee collector
            // For this example, we'll send it to the adjudicator
            bool feeSuccess = IERC20(token).transfer(disputeAdjudicator, fixedFee);
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Transfer funds
        if (freelancerShare > 0) {
            bool freelancerSuccess = IERC20(token).transfer(freelancer, freelancerShare);
            require(freelancerSuccess, "Freelancer transfer failed");
        }
        
        if (buyerShare > 0) {
            bool buyerSuccess = IERC20(token).transfer(buyer, buyerShare);
            require(buyerSuccess, "Buyer transfer failed");
        }
        
        finalized = true;
        emit EscrowCompleted(escrowId);
    }
    
    // Function to release funds to freelancer (if no dispute)
    function releaseFunds() external {
        require(msg.sender == buyer, "Only buyer can release funds");
        require(!inDispute, "Dispute active");
        require(!finalized, "Already finalized");
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No funds to release");
        
        bool success = IERC20(token).transfer(freelancer, balance);
        require(success, "Transfer failed");
        
        finalized = true;
        emit EscrowCompleted(escrowId);
    }
    
    // Get current balance of tokens in escrow
    function getBalance() external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
