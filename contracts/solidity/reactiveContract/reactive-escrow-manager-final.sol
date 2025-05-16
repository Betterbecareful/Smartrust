// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AbstractReactive.sol";

contract SimplifiedReactiveEscrowManager is IReactive, AbstractReactive {
    // Topic constants
    uint256 private constant ESCROW_DEPLOYED_TOPIC = 0x49d6cbbecd54e6f4bb869f0930c32e559f2f1f98ea8699adc172895ea739e2be; // EscrowDeployed(string,address)
    uint256 private constant DISPUTE_RAISED_TOPIC = 0xe94479a9f7e1952cc78f2d68165860d955fc8fb6f956da4c7d5f8332a95f9d60; // DisputeRaised(string,string)
    uint256 private constant ADJUDICATOR_ASSIGNED_TOPIC = 0xadabfb215c19c6db80659fa47f555eec6fc39cae1a34568a4f0c1bb0a3a34105; // AdjudicatorAssigned(string,address)
    uint256 private constant ESCROW_COMPLETED_TOPIC = 0x1f6d9c29e577abbf86b9bff647709f5185cd84db7a7dc8a73917c8c481e10dd8; // EscrowCompleted(string)

    // Chain IDs
    uint256 public constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 public adjudicatorChainId;

    // Gas limits 
    uint64 private constant CALLBACK_GAS_LIMIT = 900000; 

    // Registered contracts
    address public adjudicatorContract;
    address public owner;
    mapping(address => bool) public factories;
    mapping(uint256 => address) public escrows;

    // Event for cross-chain callbacks
    event AdjudicatorAssignedReceived(uint256 escrowId, address adjudicator);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(uint256 _adjudicatorChainId, address _adjudicatorContract) payable {
        owner = msg.sender;
        adjudicatorChainId = _adjudicatorChainId;
        adjudicatorContract = _adjudicatorContract;

        if (!vm) {
            service.subscribe(
                _adjudicatorChainId,
                _adjudicatorContract,
                ADJUDICATOR_ASSIGNED_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    function addFactory(address factory) external onlyOwner {
        factories[factory] = true;

        if (!vm) {
            service.subscribe(
                SEPOLIA_CHAIN_ID,
                factory,
                ESCROW_DEPLOYED_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    function react(LogRecord calldata log) external override vmOnly {
        if (log.topic_0 == ESCROW_DEPLOYED_TOPIC) {
            (uint256 escrowId, address escrowContract) = abi.decode(log.data, (uint256, address));

            //require(factories[log._contract], "Unknown factory");
            escrows[escrowId] = escrowContract;

            bytes memory payload = abi.encodeWithSignature(
                "subscribe(address,address)",
                address(0),
                escrowContract
            );
            emit Callback(log.chain_id, address(this), CALLBACK_GAS_LIMIT, payload);

            service.subscribe(
                log.chain_id,
                escrowContract,
                DISPUTE_RAISED_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );

            service.subscribe(
                log.chain_id,
                escrowContract,
                ESCROW_COMPLETED_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );

        } else if (log.topic_0 == DISPUTE_RAISED_TOPIC) {
            (uint256 escrowId, string memory reason) = abi.decode(log.data, (uint256, string));

            bytes memory payload = abi.encodeWithSignature(
                "requestAdjudicator(string,string)",
                escrowId,
                reason
            );
            emit Callback(adjudicatorChainId, adjudicatorContract, CALLBACK_GAS_LIMIT, payload);

        } else if (log.topic_0 == ADJUDICATOR_ASSIGNED_TOPIC) {
            (uint256 escrowId, address adjudicator) = abi.decode(log.data, (uint256, address));

            address escrowContract = escrows[escrowId];
            //require(escrowContract != address(0), "Unknown escrow");

            emit AdjudicatorAssignedReceived(escrowId, adjudicator);

            bytes memory payload = abi.encodeWithSelector(
                bytes4(keccak256("setAdjudicator(uint256,address)")),
                escrowId,
                adjudicator
            );
            emit Callback(adjudicatorChainId, adjudicatorContract, CALLBACK_GAS_LIMIT, payload);
            //emit SimplifiedReactiveEscrowManager.Callback(SEPOLIA_CHAIN_ID, escrowContract, CALLBACK_GAS_LIMIT, payload);

        } else if (log.topic_0 == ESCROW_COMPLETED_TOPIC) {
            (uint256 escrowId) = abi.decode(log.data, (uint256));

            address escrowContract = escrows[escrowId];
            bytes memory payload = abi.encodeWithSignature(
                "unsubscribe(address,address)",
                address(0),
                escrowContract
            );
            emit Callback(log.chain_id, address(this), CALLBACK_GAS_LIMIT, payload);

            delete escrows[escrowId];
        }
    }
}
