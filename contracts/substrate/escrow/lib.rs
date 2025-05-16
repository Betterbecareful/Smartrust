#![cfg_attr(not(feature = "std"), no_std)]

#[ink::contract]
mod escrow {
    #[ink(storage)]
    pub struct Escrow {
        depositor: AccountId,
        beneficiary: AccountId,
        arbiter: AccountId,
        deposited: Balance,
        is_released: bool,
    }

    impl Escrow {
        /// Instantiate the escrow contract with a beneficiary and arbiter.
        #[ink(constructor)]
        pub fn new(beneficiary: AccountId, arbiter: AccountId) -> Self {
            Self {
                depositor: Self::env().caller(),
                beneficiary,
                arbiter,
                deposited: 0,
                is_released: false,
            }
        }

        /// Only the depositor can deposit funds.
        #[ink(message, payable)]
        pub fn deposit(&mut self) {
            assert_eq!(self.depositor, self.env().caller(), "Only depositor can deposit");
            let value = self.env().transferred_value();
            assert!(value > 0, "Deposit must be greater than zero");
            self.deposited = self
                .deposited
                .checked_add(value)
                .expect("Overflow in deposit");
        }

        /// Only the arbiter can release funds to the beneficiary.
        #[ink(message)]
        pub fn release(&mut self) {
            assert_eq!(self.arbiter, self.env().caller(), "Only arbiter can release funds");
            assert!(!self.is_released, "Funds already released");
            self.is_released = true;
            if self.deposited > 0 {
                self.env()
                    .transfer(self.beneficiary, self.deposited)
                    .expect("Transfer to beneficiary failed");
            }
        }

        /// Only the arbiter can refund funds to the depositor.
        #[ink(message)]
        pub fn refund(&mut self) {
            assert_eq!(self.arbiter, self.env().caller(), "Only arbiter can refund");
            assert!(!self.is_released, "Funds already released");
            self.is_released = true;
            if self.deposited > 0 {
                self.env()
                    .transfer(self.depositor, self.deposited)
                    .expect("Refund transfer failed");
            }
        }

        /// Returns the current status: deposited amount and whether funds are released.
        #[ink(message)]
        pub fn get_status(&self) -> (Balance, bool) {
            (self.deposited, self.is_released)
        }

        /// Returns the addresses involved.
        #[ink(message)]
        pub fn get_parties(&self) -> (AccountId, AccountId, AccountId) {
            (self.depositor, self.beneficiary, self.arbiter)
        }
    }
}