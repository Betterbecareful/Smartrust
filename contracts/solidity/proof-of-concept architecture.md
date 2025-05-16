### Proof of Concept Architecture

# Cross-Chain Three-Party Escrow with Reactive.Network

This is a design document that outlines building a proof-of-concept (PoC) that leverages Reactive.network for cross‐chain messaging and orchestration. The PoC will use scaffolded factory, escrow, and adjudicator contracts while concentrating on the dynamic subscription management and cross-chain callbacks needed to coordinate events across chains.

## 1\. Overview

This PoC demonstrates an on-chain cross-chain three-party escrow system where:

- **Escrow contracts** are deployed on multiple chains by factory contracts.  
- **Dispute events** (raised by either the buyer or freelancer) trigger a cross-chain message that contacts an adjudicator marketplace contract on a designated chain.  
- **Adjudicator selection** occurs off-chain or via a simple pool contract that receives a selection from an external marketplace.  
- **Reactive.network’s infrastructure** handles the dynamic subscription to deployed escrow contracts and routes messages between chains via callbacks.

**Key Focus Areas:**

- **Dynamic Subscriptions:** Listening to `EscrowDeployed` events on various factory contracts and automatically subscribing the Reactive Smart Contract (RSC) to events from the newly deployed escrow contracts.  
- **Cross-Chain Messaging & Orchestration:** Routing dispute events and adjudicator assignment events via Reactive.network.  
- **Callback-based Subscription Management:** Using Reactive.network’s system contract via callback messages to subscribe and unsubscribe dynamically.

---

## 2\. High-Level Architecture

### Building Blocks

1. **Factory Contracts (Scaffolded) on Multiple Chains**  
     
   - Deploy escrow contracts and emit an `EscrowDeployed` event.  
   - Each event includes a human-readable identifier (e.g., `chain_avax_escrow_123`) that the factory assigns upon deployment.

   

2. **Escrow Contracts (Scaffolded)**  
     
   - Handle fund deposits and record basic party information (buyer, freelancer).  
   - Emit:  
     - `EscrowDeployed` event (upon creation, via the factory).  
     - `DisputeRaised` event when a dispute occurs.  
     - (Optional) A request for a replacement adjudicator if the initially assigned one is non-responsive.  
   - Do **not** generate cross-chain dispute IDs; they only include a reference to the deployed escrow (or its human-readable identifier).

   

3. **Adjudicator Marketplace / Pool Contract (Scaffolded)**  
     
   - Manages a pool of arbitrators (either via off-chain processes or a simple first-come-first-serve model).  
   - When an adjudicator is selected (by external means or an internal selection process), the contract emits an event (e.g., `AdjudicatorAssigned`).

   

4. **Reactive.network Infrastructure (Reactive Smart Contract \- RSC)**  
     
   - **Dynamic Subscriptions:** Initially listens for `EscrowDeployed` events. On detecting such an event, the RSC registers (via a callback to the system contract) the new escrow contract’s address for further event listening.  
   - **Cross-Chain Event Handling:**  
     1. **New Escrow Subscriptions:**  
        Listen for `EscrowDeployed` events and add the escrow contract to its subscription list.  
     2. **Dispute Events:**  
        Listen for `DisputeRaised` events on subscribed escrow contracts and relay the dispute (using the human-readable escrow ID as reference) to the adjudicator marketplace contract.  
        - **Alternate Path:** If an adjudicator is non-responsive, the escrow contract can send a “replacement adjudicator” request.  
     3. **Adjudicator Assignment:**  
        Listen for `AdjudicatorAssigned` events from the adjudicator marketplace and relay the selected adjudicator information to the appropriate escrow contract (adding the adjudicator to the list of escrow voters).  
     4. **Escrow Completion:**  
        Upon completion of an escrow (successful resolution or cancellation), the RSC receives a completion event and unsubscribes from the escrow’s events.

   

2. **Subscription Management via Callbacks**  
     
   - Since subscriptions are managed through a system contract accessible only by the network, the RSC must generate callback events (using the `emit Callback(...)` pattern) to instruct the system to subscribe or unsubscribe from events.  
   - All dynamic changes must be triggered via callbacks from within the `react()` method of the RSC.

### Deployment Flow

![][image1]

---

## 3\. Detailed Message Types and Flow

![][image2]

### Message Type 1: New Escrow Deployment & Dynamic Subscription

**Purpose:**  
When a new escrow contract is deployed (via a factory contract), the RSC must automatically subscribe to its events.

**Flow:**

- **Factory Contract:**  
  When deploying an escrow, emit an event:  
  
  ```
  event EscrowDeployed(string escrowIdentifier, address escrowContract);  
  ```
    
- **Reactive Smart Contract (RSC):**  
  - Listen for the `EscrowDeployed` event from all factory contracts.  
  - When detected, extract the escrow contract address and human-readable identifier.  
  - Generate a callback to the system contract with a `subscribe()` request:  
    **Callback Payload Example:**  
    ```   
      bytes memory payload \= abi.encodeWithSignature(  
          "subscribe(address,address)",  
          address(0),                // from (could be zero if not needed)  
          escrowContractAddress      // the newly deployed escrow contract address  
      );  
      emit Callback(REACTIVE\_CHAIN\_ID, address(this), CALLBACK\_GAS\_LIMIT, payload);
     ```
      
  - Internally add the escrow contract to an internal list so that subsequent events (disputes, completions) are routed properly.

### **Message Type 2: Dispute Raised & Adjudicator Request**

**Purpose:**  
When a dispute is raised on an escrow contract, relay the dispute details to the adjudicator marketplace.

**Flow:**

- **Escrow Contract:**  
  Emit a dispute event (use the escrow’s human-readable identifier):  

  ``` 
  event DisputeRaised(string escrowIdentifier, string reason);  
  ```
    
- **RSC – Dispute Handling:**  
  - Listen for `DisputeRaised` events from any subscribed escrow contract.  
  - On event detection, generate a cross-chain message to the adjudicator marketplace contract:  
  **Payload Example:**  

    ```
      bytes memory payload \= abi.encodeWithSignature(  
        
          "requestAdjudicator(string,string)",  
        
          escrowIdentifier,  // e.g., "chain\_avax\_escrow\_123"  
        
          disputeReason  
        
      );  
        
      emit Callback(ADJUDICATOR\_CHAIN\_ID, adjudicatorMarketplaceAddress, CALLBACK\_GAS\_LIMIT, payload);
    ```
      
  - **Alternate Flow (Non-Responsive Adjudicator):**  
    If an adjudicator becomes non-responsive, the escrow contract can emit a specific event (e.g., `ReplacementRequested`) and the RSC will relay a similar message to the adjudicator marketplace for a replacement.

### **Message Type 3: Adjudicator Assignment**

**Purpose:**  
When an adjudicator is selected by the adjudicator marketplace, the RSC relays this assignment back to the originating escrow contract.

**Flow:**

- **Adjudicator Marketplace Contract:**  
  After selection, emit an event:  

  ```
  event AdjudicatorAssigned(string escrowIdentifier, address adjudicator);
  ```
  
- **RSC – Assignment Handling:**  
  - Listen for `AdjudicatorAssigned` events.  
  - On event detection, generate a callback to the originating escrow contract (located via the escrow identifier):  
  **Payload Example:**  
        
     ```
      bytes memory payload \= abi.encodeWithSignature(  
        
          "setAdjudicator(address)",  
        
          adjudicator  
        
      );  
        
      // Determine the target chain and escrow contract address from the subscription list  
        
      emit Callback(ORIGINATING\_CHAIN\_ID, escrowContractAddress, CALLBACK\_GAS\_LIMIT, payload);
     ```
      
  - The escrow contract, on receiving this callback, updates its internal state to include the assigned adjudicator.

### **Message Type 4: Escrow Completion & Unsubscription**

**Purpose:**  
When an escrow contract completes (either by resolution or cancellation), the RSC should unsubscribe from its events to free resources.

**Flow:**

- **Escrow Contract:**  
  Emit an event such as:  

  '''
  event EscrowCompleted(string escrowIdentifier);  
  '''
    
- **RSC – Unsubscription Handling:**  
  - Listen for `EscrowCompleted` events.  
  - On event detection, generate a callback for unsubscription:  
    - **Payload Example:**  

     ```
      bytes memory payload \= abi.encodeWithSignature(  
        
          "unsubscribe(address,address)",  
        
          address(0),  
        
          escrowContractAddress  
        
      );  
        
      emit Callback(REACTIVE\_CHAIN\_ID, address(this), CALLBACK\_GAS\_LIMIT, payload);
     ```
      
  - Remove the escrow contract from the internal subscription list.

---

## 4\. Sample Reactive Smart Contract Code

Below is a modified version of the demo “Approval Magic” code that your developers can adapt. It demonstrates dynamic subscriptions and message routing based on event topics. Replace the constants (e.g., `SUBSCRIBE_TOPIC_0`, `UNSUBSCRIBE_TOPIC_0`, `REACTIVE_CHAIN_ID`, etc.) with your actual configuration values.

    ```
    pragma solidity ^0.8.0;  
    contract ReactiveEscrowManager {

    // Constants for topic values (to be defined according to your system)  
    uint256 constant SUBSCRIBE\_TOPIC\_0 \= 1;  
    uint256 constant UNSUBSCRIBE\_TOPIC\_0 \= 2;

    // Define additional topics as needed for dispute and adjudicator messages  
    // Example chain IDs for callbacks (these should be configured accordingly)  
    uint256 constant REACTIVE\_CHAIN\_ID \= 100;  
    uint256 constant ADJUDICATOR\_CHAIN\_ID \= 200;

    // Gas limit for callbacks  
    uint256 constant CALLBACK\_GAS\_LIMIT \= 100000;

    // Addresses for external contracts (update with actual addresses)  
    address adjudicatorMarketplaceAddress;

    // Map escrow identifiers to their contract addresses (updated on subscription)  
    mapping(string \=\> address) public escrowContracts;

    // \--- Event emitted to generate a callback to the Reactive Network system contract \---  
    event Callback(uint256 targetChainId, address targetAddress, uint256 gasLimit, bytes payload);

    // The main react() method processes incoming events from the Reactive Network  
    function react(  
        uint256 /\* chain\_id \*/,  
        address originatingContract,  
        uint256 topic\_0,  
        uint256 topic\_1,  
        uint256 /\* topic\_2 \*/,  
        uint256 /\* topic\_3 \*/,  
        bytes calldata data,  
        uint256 /\* block\_number \*/,  
        uint256 /\* op\_code \*/  
    ) external /\* vmOnly modifier, if applicable \*/ {

        // Topic handling for dynamic subscription management and message routing  
        if (topic\_0 \== SUBSCRIBE\_TOPIC\_0) {

            // Topic indicates a new subscription request (e.g., from an EscrowDeployed event)  
            // Extract the escrow contract address from topic\_1 (assuming it is encoded as address(uint160(topic\_1)))  
            address newEscrow \= address(uint160(topic\_1));

            // Assume data carries the human-readable identifier (e.g., "chain\_avax\_escrow\_123")  
            string memory escrowId \= abi.decode(data, (string));  
            escrowContracts\[escrowId\] \= newEscrow;  
              
            // Generate callback to subscribe to the new escrow's events  
            bytes memory payload \= abi.encodeWithSignature(  
                "subscribe(address,address)",  
                address(0),  
                newEscrow  
            );  
            emit Callback(REACTIVE\_CHAIN\_ID, address(this), CALLBACK\_GAS\_LIMIT, payload);  
        } else if (topic\_0 \== UNSUBSCRIBE\_TOPIC\_0) {

            // Topic indicates an unsubscription request (e.g., from an EscrowCompleted event)  
            address escrowAddress \= address(uint160(topic\_1));  
            bytes memory payload \= abi.encodeWithSignature(  
                "unsubscribe(address,address)",  
                address(0),  
                escrowAddress  
            );  
            emit Callback(REACTIVE\_CHAIN\_ID, address(this), CALLBACK\_GAS\_LIMIT, payload);

        } else {

            // For other events, determine if they relate to dispute requests or adjudicator assignments.  
            // For example, if the data encodes a dispute request, extract the escrowId and dispute reason.  
            // Here we assume that topic\_0 values other than SUBSCRIBE/UNSUBSCRIBE indicate:  
            // \- DisputeRaised events or  
            // \- AdjudicatorAssigned events (if coming from adjudicator marketplace)  
            // The exact implementation would depend on how you encode the event topics.  
            // Example for a dispute event:  
            (string memory escrowId, string memory disputeReason) \= abi.decode(data, (string, string));  
            // Determine the target adjudicator marketplace and relay the dispute  
            bytes memory payload \= abi.encodeWithSignature(  
                "requestAdjudicator(string,string)",  
                escrowId,  
                disputeReason  
            );  
            emit Callback(ADJUDICATOR\_CHAIN\_ID, adjudicatorMarketplaceAddress, CALLBACK\_GAS\_LIMIT, payload);  
        }  
    }  
    }
     ```
**Notes on the Sample Code:**

- **Dynamic Subscription:**  
  The `react()` method checks if `topic_0` equals the subscription or unsubscription topic. In those cases, it emits a callback with the appropriate payload. The payload instructs the Reactive Network’s system contract to manage the subscription.  
- **Dispute & Adjudicator Handling:**  
  Other topics are interpreted as dispute-related events. You may extend this logic to differentiate between a new dispute and a replacement adjudicator request.  
- **Escrow Identifier:**  
  Instead of generating a cross-chain dispute ID within an escrow contract, the factory assigns a human-readable identifier (e.g., `"chain_avax_escrow_123"`) that is passed along with events. The RSC uses this identifier to map to the escrow contract’s address.

---

## 5\. Developer Action Items 

1. **Scaffold Contracts:**  
     
   - Create basic factory contracts that emit `EscrowDeployed` events.  
   - Create a scaffold escrow contract that supports:  
     - `DisputeRaised` events with a human-readable escrow identifier.  
     - An event for escrow completion.  
     - (Optionally) an event for requesting a replacement adjudicator.  
   - Create a scaffold adjudicator marketplace contract that emits an `AdjudicatorAssigned` event when an adjudicator is selected.

   

2. **Implement the Reactive Smart Contract (RSC):**  
     
   - Adapt the sample code above into a dedicated contract that can:  
     - Listen to events from factory and escrow contracts.  
     - Dynamically subscribe and unsubscribe to escrow contract events via callbacks.  
     - Route dispute events to the adjudicator marketplace.  
     - Relay adjudicator assignment events back to the corresponding escrow contract.  
   - Ensure that dynamic subscription management via callbacks to the system contract is fully functional.

   

3. **Test Cross-Chain Messaging:**  
     
   - Deploy your scaffold contracts on test networks.  
   - Simulate the following flows:  
     - **New Escrow Deployment:** Verify that the RSC subscribes to the escrow’s events.  
     - **Dispute Initiation:** Trigger a dispute event and confirm that the RSC relays the dispute to the adjudicator marketplace.  
     - **Adjudicator Assignment:** After the adjudicator marketplace selects an arbitrator, verify that the RSC relays the assignment to the appropriate escrow contract.  
     - **Escrow Completion:** Ensure that upon escrow completion, the RSC unsubscribes from the escrow contract’s events.  
     - **Replacement Flow:** Simulate a non-responsive adjudicator scenario and verify the replacement adjudicator request flow.

   

4. **Security and Validation:**  
     
   - Implement necessary checks in the RSC to ensure that callbacks and cross-chain messages are only accepted from trusted sources.  
   - Validate that only authenticated events trigger subscription changes.

---

## 6\. Summary

This document outlines a PoC that emphasizes the orchestration of cross-chain messaging using Reactive.network. The focus is on:

- Dynamic subscription management through callbacks.  
- Routing events between factory, escrow, and adjudicator marketplace contracts.  
- Handling dispute events and adjudicator assignment without burdening individual escrow contracts with cross-chain ID management.

By following this design, your team will be able to demonstrate a functional cross-chain escrow system that leverages Reactive.network’s capabilities, paving the way for more advanced multi-chain applications.

Feel free to iterate on this design as you integrate additional business logic or optimize the cross-chain communication patterns.

---

## End of Document
