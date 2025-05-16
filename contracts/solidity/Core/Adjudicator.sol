// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AbstractReactive.sol";

contract SimplifiedAdjudicator is AbstractPayer {
    address public owner;
    
    // Track pending disputes
    mapping(uint256 => bool) public pendingDisputes;
    mapping(uint256 => address) public escrowAddresses;
    mapping(uint256 => address) public assignedAdjudicators;
    
    // Events
    event DisputeReceived(uint256 escrowIdentifier, string reason);
    event AdjudicatorAssigned(uint256 escrowIdentifier, address adjudicator);
    event RulingIssued(uint256 escrowIdentifier, uint256 fixedFee, uint256 payoutBasisPoints);
    event PaymentReceived(address from, uint256 amount);

    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    // Called by the RSC when a dispute is raised
    function requestAdjudicator(
        uint256 escrowId, 
        string calldata reason,
        address escrowAddress
    ) external {
        // In a real setup, you'd verify the caller is the RSC
        require(!pendingDisputes[escrowId], "Dispute already pending");
        require(escrowAddress != address(0), "Invalid escrow address");
        
        pendingDisputes[escrowId] = true;
        escrowAddresses[escrowId] = escrowAddress;
        emit DisputeReceived(escrowId, reason);
    }
    
    // Called by the owner to assign an adjudicator to a dispute
    function assignAdjudicator(uint256 escrowId, address adjudicator) external onlyOwner {
        require(adjudicator != address(0), "Invalid adjudicator");
        
        assignedAdjudicators[escrowId] = adjudicator;
        emit AdjudicatorAssigned(escrowId, adjudicator);
    }

    // Test function 
    function setAdjudicator(uint256 escrowId, address adjudicator) external {
        emit AdjudicatorAssigned(escrowId, adjudicator);
    }
    
    // Called by an assigned adjudicator to issue a ruling
    function issueRuling(
        uint256 escrowId,
        uint256 fixedFee,
        uint256 payoutBasisPoints
    ) external {
        require(msg.sender == assignedAdjudicators[escrowId], "Not authorized");
        require(pendingDisputes[escrowId], "No pending dispute");
        address escrowAddress = escrowAddresses[escrowId];
        require(escrowAddress != address(0), "Escrow address not found");
        
        // Emit an event for the ruling
        emit RulingIssued(escrowId, fixedFee, payoutBasisPoints);
        
        // Clean up
        delete pendingDisputes[escrowId];
        delete assignedAdjudicators[escrowId];
        delete escrowAddresses[escrowId];
    }
    
    // Helper functions for balance management
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    // Allow owner to deposit funds
    function deposit() external payable onlyOwner {
        emit PaymentReceived(msg.sender, msg.value);
    }
    
    // Allow owner to withdraw excess funds
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
    }
    
    // Check if contract can afford a specific payment
    function canAffordPayment(uint256 amount) public view returns (bool) {
        return address(this).balance >= amount;
    }
}
