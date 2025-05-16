// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ReactiveEscrowAdjudicatorBridge
 * @notice This contract acts as a bridge between escrow contracts and the adjudicator contract via Reactive.network.
 * It processes events (e.g. new escrow subscriptions, dispute raised events, adjudicator assignment or ruling events)
 * and emits callback events with ABI‑encoded payloads that instruct the Reactive Network to relay the call to the appropriate
 * target contract on the correct chain.
 *
 * The contract assumes that:
 *  - Escrow contracts implement a finalizeDispute(uint256,uint256) function (per the IEscrowFinal interface).
 *  - The adjudicator contract processes dispute requests (via a function such as requestAdjudication) and issues rulings.
 *
 * All major actions emit a Callback event for off‑chain integration.
 */
contract ReactiveEscrowAdjudicatorBridge {
    // ====================================================
    // ============= Constants & Chain IDs ================
    // ====================================================
    
    // Topics indicating event type.
    uint256 constant SUBSCRIBE_TOPIC          = 1;
    uint256 constant UNSUBSCRIBE_TOPIC        = 2;
    uint256 constant DISPUTE_RAISED_TOPIC       = 3;
    uint256 constant ADJUDICATOR_ASSIGNED_TOPIC = 4;
    // Optionally, a separate topic for ruling issuance.
    uint256 constant RULING_ISSUED_TOPIC        = 5;
    
    // Chain identifiers – adjust as needed per deployment.
    uint256 constant REACTIVE_CHAIN_ID    = 100;  // Chain where Reactive callbacks are processed.
    uint256 constant ESCROW_CHAIN_ID      = 101;  // Chain where escrow contracts are deployed.
    uint256 constant ADJUDICATOR_CHAIN_ID = 102;  // Chain where the adjudicator contract resides.
    
    // Gas limit to use for callbacks.
    uint256 constant CALLBACK_GAS_LIMIT = 150000;
    
    // ====================================================
    // =================== State Variables ================
    // ====================================================
    
    // Address of the adjudicator contract (set by admin/off-chain configuration).
    address public adjudicatorContractAddress;
    
    // Dynamic registry to track escrow contracts that are subscribed.
    mapping(address => bool) public subscribedEscrows;
    
    // ====================================================
    // ======================== Events ======================
    // ====================================================
    
    /**
     * @notice Emitted to instruct the Reactive Network system to perform a callback.
     * @param targetChainId The chain where the callback should be executed.
     * @param targetAddress The contract address on the target chain to call.
     * @param gasLimit The gas limit for the callback execution.
     * @param payload The ABI‑encoded function call that should be executed.
     */
    event Callback(uint256 targetChainId, address targetAddress, uint256 gasLimit, bytes payload);
    
    // ====================================================
    // ===================== Admin Functions ================
    // ====================================================
    
    /**
     * @notice Sets (or updates) the adjudicator contract address.
     * In production, proper access control (e.g., onlyOwner) should be implemented.
     * @param _addr The new adjudicator contract address.
     */
    function setAdjudicatorContractAddress(address _addr) external {
        // For demonstration, no access control is added here.
        require(_addr != address(0), "Invalid adjudicator address");
        adjudicatorContractAddress = _addr;
    }
    
    // ====================================================
    // ===================== Core Logic =====================
    // ====================================================
    
    /**
     * @notice The main reactive function that processes incoming events.
     * It examines the primary topic (topic_0) to determine the event type and
     * emits a Callback event with an appropriate payload targeting the intended contract.
     *
     * Expected topics:
     * - SUBSCRIBE_TOPIC: Registers a new escrow contract subscription.
     * - UNSUBSCRIBE_TOPIC: Unregisters an escrow contract (e.g., when escrow completes).
     * - DISPUTE_RAISED_TOPIC: A dispute is raised by an escrow contract.
     * - ADJUDICATOR_ASSIGNED_TOPIC: An adjudicator assignment is finalized (or ruling is issued).
     * - RULING_ISSUED_TOPIC: Alternatively, a ruling event may be relayed directly.
     *
     * @param /*chain_id*/ Unused incoming chain id.
     * @param originatingContract The address of the contract that emitted the event.
     * @param topic_0 The primary topic indicating the event type.
     * @param topic_1 Typically encodes an address (e.g., escrow contract address).
     * @param topic_2 Typically encodes another address if needed.
     * @param /*topic_3*/ Unused fourth topic.
     * @param data The event’s data payload (ABI‑encoded).
     * @param /*block_number*/ Unused block number.
     * @param /*op_code*/ Unused op_code.
     */
    function react(
        uint256 /* chain_id */,
        address originatingContract,
        uint256 topic_0,
        uint256 topic_1,
        uint256 topic_2,
        uint256 /* topic_3 */,
        bytes calldata data,
        uint256 /* block_number */,
        uint256 /* op_code */
    ) external {
        if (topic_0 == SUBSCRIBE_TOPIC) {
            // New escrow deployment; register and subscribe to its events.
            address newEscrow = address(uint160(topic_1));
            subscribedEscrows[newEscrow] = true;
            bytes memory payload = abi.encodeWithSignature("subscribe(address,address)", address(0), newEscrow);
            emit Callback(REACTIVE_CHAIN_ID, address(this), CALLBACK_GAS_LIMIT, payload);
        } else if (topic_0 == UNSUBSCRIBE_TOPIC) {
            // Escrow has completed; unsubscribe.
            address escrow = address(uint160(topic_1));
            subscribedEscrows[escrow] = false;
            bytes memory payload = abi.encodeWithSignature("unsubscribe(address,address)", address(0), escrow);
            emit Callback(REACTIVE_CHAIN_ID, address(this), CALLBACK_GAS_LIMIT, payload);
        } else if (topic_0 == DISPUTE_RAISED_TOPIC) {
            // A dispute has been raised in an escrow contract.
            // Expected data payload: (string escrowId, string disputeReason, address buyer, address freelancer)
            (string memory escrowId, string memory disputeReason, address buyer, address freelancer) = abi.decode(data, (string, string, address, address));
            // Construct a callback payload to forward dispute details to the adjudicator contract.
            bytes memory payload = abi.encodeWithSignature(
                "requestAdjudication(uint256,address,address,address,string,string)",
                0, // chain id can be 0 or forwarded if needed
                originatingContract, // the escrow contract address
                buyer,
                freelancer,
                escrowId,
                disputeReason
            );
            emit Callback(ADJUDICATOR_CHAIN_ID, adjudicatorContractAddress, CALLBACK_GAS_LIMIT, payload);
        } else if (topic_0 == ADJUDICATOR_ASSIGNED_TOPIC) {
            // An adjudicator assignment has been finalized.
            // Expected data payload: (string escrowId, uint256 fixedFee, uint256 payoutBasisPoints)
            (string memory escrowId, uint256 fixedFee, uint256 payoutBasisPoints) = abi.decode(data, (string, uint256, uint256));
            // Use topic_1 to encode the target escrow contract address.
            address escrowContract = address(uint160(topic_1));
            // Construct payload to call finalizeDispute on the escrow contract.
            bytes memory payload = abi.encodeWithSignature("finalizeDispute(uint256,uint256)", fixedFee, payoutBasisPoints);
            emit Callback(ESCROW_CHAIN_ID, escrowContract, CALLBACK_GAS_LIMIT, payload);
        } else if (topic_0 == RULING_ISSUED_TOPIC) {
            // Alternatively, if a ruling event is emitted directly by the adjudicator contract.
            // Expected data payload: (string escrowId, uint256 fixedFee, uint256 payoutBasisPoints)
            (string memory escrowId, uint256 fixedFee, uint256 payoutBasisPoints) = abi.decode(data, (string, uint256, uint256));
            address escrowContract = address(uint160(topic_1));
            bytes memory payload = abi.encodeWithSignature("finalizeDispute(uint256,uint256)", fixedFee, payoutBasisPoints);
            emit Callback(ESCROW_CHAIN_ID, escrowContract, CALLBACK_GAS_LIMIT, payload);
        }
    }
}
