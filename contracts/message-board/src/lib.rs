#![no_std]
//! On-chain message board smart contract.
//!
//! Stores a growing list of messages on the Stellar network. Anyone can read
//! the messages; posting a message requires the author's authorization.

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

/// A single message stored on-chain.
#[contracttype]
#[derive(Clone)]
pub struct Message {
    /// The address of the account that posted the message.
    pub author: Address,
    /// The message text.
    pub text: String,
}

/// Keys used for the contract's instance storage.
#[contracttype]
pub enum DataKey {
    /// Holds the full list of posted messages.
    Messages,
}

#[contract]
pub struct MessageBoard;

#[contractimpl]
impl MessageBoard {
    /// Posts a new message to the board.
    ///
    /// Requires the author's authorization (signature), appends the message to
    /// on-chain storage, and returns the new total number of messages.
    pub fn add_message(env: Env, author: Address, text: String) -> u32 {
        // Ensure the caller actually authorized this call (authentication).
        author.require_auth();

        let mut messages: Vec<Message> = env
            .storage()
            .instance()
            .get(&DataKey::Messages)
            .unwrap_or(Vec::new(&env));

        messages.push_back(Message { author, text });
        env.storage().instance().set(&DataKey::Messages, &messages);

        messages.len()
    }

    /// Returns every message that has been posted to the board.
    pub fn get_messages(env: Env) -> Vec<Message> {
        env.storage()
            .instance()
            .get(&DataKey::Messages)
            .unwrap_or(Vec::new(&env))
    }

    /// Returns the total number of messages posted to the board.
    pub fn get_count(env: Env) -> u32 {
        let messages: Vec<Message> = env
            .storage()
            .instance()
            .get(&DataKey::Messages)
            .unwrap_or(Vec::new(&env));
        messages.len()
    }
}