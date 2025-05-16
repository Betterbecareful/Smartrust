# Contracts
Our SmarTrust smart contracts go here.

One folder for the core contracts: Front end, Reactive Network multi-chain orchestrator, and the Arbitrator contracts.
Then one folder for each of the satelite chain-specific contracts, organized by on-chain language (e.g. Solidity for EVM, Rust for Solana, Move for Sui, etc)

Our contracts are designed for multichain operatbility:
- Arbitrator orchestratation
- Cross-chain intents messaging
- Escrows are distributed across several chains:
  - Escrow template
  - Escrow factory
