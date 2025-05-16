#![cfg_attr(not(feature = "std"), no_std)]

#[ink::contract]
mod escrow_factory {
    use escrow::EscrowRef;
    use ink::prelude::vec::Vec;

    #[ink(storage)]
    pub struct EscrowFactory {
        escrows: Vec<AccountId>,
        escrow_code_hash: Hash,
    }

    #[ink(event)]
    pub struct EscrowDeployed {
        #[ink(topic)]
        escrow: AccountId,
        #[ink(topic)]
        creator: AccountId,
    }

    impl EscrowFactory {
        /// Instantiate the factory with the code hash of the Escrow contract.
        #[ink(constructor)]
        pub fn new(escrow_code_hash: Hash) -> Self {
            Self {
                escrows: Vec::new(),
                escrow_code_hash,
            }
        }

        /// Deploy a new Escrow contract instance.
        #[ink(message, payable)]
        pub fn deploy_escrow(
            &mut self,
            beneficiary: AccountId,
            arbiter: AccountId,
            endowment: Balance,
        ) -> AccountId {
            let salt = Self::env().block_number().to_le_bytes();

            // Using try_instantiate to handle possible errors gracefully.
            let escrow = EscrowRef::new(beneficiary, arbiter)
                .endowment(endowment)
                .code_hash(self.escrow_code_hash)
                .salt_bytes(&salt)
                .try_instantiate()
                .expect("Failed to instantiate Escrow contract");

            let escrow_account = escrow.to_account_id();
            self.escrows.push(escrow_account);

            self.env().emit_event(EscrowDeployed {
                escrow: escrow_account,
                creator: self.env().caller(),
            });

            escrow_account
        }

        /// Get all deployed escrow contract addresses.
        #[ink(message)]
        pub fn get_escrows(&self) -> Vec<AccountId> {
            self.escrows.clone()
        }
    }
}