# SmarTrust

SmarTrust is a decentralized, multi-chain escrow platform designed to eliminate counterparty risk and simplify peer-to-peer transactions. By combining Polkadot's robust substrate framework with AI-driven contract generation and dispute mediation, SmarTrust delivers a seamless, secure, and user-friendly experience.

## Business Problem

In the freelance and gig economy, trust gaps and payment risks often slow down or derail transactions. Buyers worry that work will never be delivered, while sellers fear non-payment after completing a project. Traditional escrow solutions introduce third-party custody and complex legal processes, creating friction and added costs for both parties.

SmarTrust addresses these issues by providing an on-demand, self-custodial escrow vault for every agreement. Funds remain under the direct control of the transacting parties until agreed conditions are met, removing the need for intermediaries and reducing legal overhead.

## AI-Powered User Experience

Drafting precise escrow contracts and navigating dispute resolution can be daunting. SmarTrust leverages a custom AI pipeline to streamline both:

* Contract Generation: Users simply describe their deal terms. Our AI transforms those inputs into clear, unambiguous smart-contract code, minimizing human error and legal complexity.
* Dispute Mediation: If disagreements arise, the AI mediator analyzes transaction histories, contract terms, and evidence to propose fair resolutions. This reduces delays, lowers costs, and often resolves conflicts without human intervention.

By embedding AI into the core workflow, SmarTrust makes blockchain escrow accessible to non-technical users and accelerates transaction finality.

## Built on Polkadot

At the heart of SmarTrust lies a factory contract deployed on Polkadot's Westend testnet:

* Factory Pattern: A single, on-chain template contract instantiates a unique escrow vault for each buyer-seller pair, parameterized by deposit amounts, arbiters, and timeouts.
* Shared Security & Efficiency: Leveraging Substrate modules, SmarTrust vaults benefit from Polkadot’s shared security model and fast finality. Gas fees are optimized through Polkadot’s efficient consensus, keeping transaction costs low.
* Runtime Upgradability: Using Substrate’s upgradeable runtime, vault logic can be enhanced or patched without migrating existing contracts—ensuring future-proof deployments.

## Installation

1. Clone the repository:

Bash

   git clone https://github.com/your-org/smartrust.git
   cd smartrust

2. Install dependencies:

Bash

   npm install
   cd contracts && npm install

3. Configure your environment in .env (RPC endpoints, AI service keys, etc.).
4. Deploy the factory contract to Westend:

Bash

   npm run deploy:westend

## Usage

* Web App: Launch the Next.js frontend and connect your wallet to create and fund escrow vaults.
* CLI: Interact with the smart contracts via our CLI for batch deployments and testing.

## Contributing

Contributions are welcome! Please open issues or submit pull requests. Ensure AI models are properly mocked in tests and follow Substrate’s recommended patterns.

## License

MIT License. See LICENSE for details.
