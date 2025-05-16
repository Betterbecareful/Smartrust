// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

// Define the interface properly with the same function signature as the SimplifiedEscrow contract
interface ISimplifiedEscrow {
    function initialize(
        address buyer,
        address freelancer,
        address token,
        string memory escrowId
    ) external;
}

contract EscrowFactory {
    // DO NOT use using-for pattern here
    
    // This is the address of the already deployed SimplifiedEscrow template
    address public immutable escrowTemplate;
    
    // Counter for generating unique IDs
    uint256 private escrowCounter;
    
    // Owner of the factory
    address public owner;
    
    // Array to store all deployed escrows
    address[] public deployedEscrows;
    
    // Event to emit when a new escrow is created
    event EscrowDeployed(string escrowIdentifier, address escrowContract);
    
    // Constructor to set the template address - THIS MUST BE DEPLOYED FIRST
    constructor(address _escrowTemplate) {
        require(_escrowTemplate != address(0), "Template cannot be zero address");
        escrowTemplate = _escrowTemplate;
        owner = msg.sender;
        escrowCounter = 0;
    }
    
    // Access control
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    // Function to deploy a new escrow clone
    function deployEscrow(
        address buyer,
        address freelancer,
        address token
    ) external onlyOwner returns (address newEscrow) {
        // Validate input
        require(buyer != address(0), "Buyer cannot be zero address");
        require(freelancer != address(0), "Freelancer cannot be zero address");
        require(token != address(0), "Token cannot be zero address");
        
        // Generate escrow ID
        string memory escrowId = string(abi.encodePacked(
            "sepolia_escrow_",
            toString(escrowCounter)
        ));
        
        // Increment counter
        escrowCounter++;
        
        // IMPORTANT: Create clone using the direct function call, not using-for pattern
        newEscrow = Clones.clone(escrowTemplate);
        
        // CRUCIAL: Explicitly typecast and call initialize
        ISimplifiedEscrow(newEscrow).initialize(
            buyer,
            freelancer,
            token,
            escrowId
        );
        
        // Add to tracking array
        deployedEscrows.push(newEscrow);
        
        // Emit event
        emit EscrowDeployed(escrowId, newEscrow);
    }
    
    // Helper to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    // View function to get all deployed escrows
    function getDeployedEscrows() external view returns (address[] memory) {
        return deployedEscrows;
    }
    
    // Get count
    function getEscrowCount() external view returns (uint256) {
        return escrowCounter;
    }
}
