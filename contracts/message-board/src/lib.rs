#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Message {
    pub author: Address,
    pub text: String,
}

#[contracttype]
pub enum DataKey {
    Messages,
}

#[contract]
pub struct MessageBoard;

#[contractimpl]
impl MessageBoard {
    // نوشتن: یک پیام جدید روی زنجیره ذخیره می‌کند
    pub fn add_message(env: Env, author: Address, text: String) -> u32 {
        // مطمئن می‌شود که فرستنده واقعاً امضا کرده (احراز هویت)
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

    // خواندن: همه‌ی پیام‌ها را برمی‌گرداند
    pub fn get_messages(env: Env) -> Vec<Message> {
        env.storage()
            .instance()
            .get(&DataKey::Messages)
            .unwrap_or(Vec::new(&env))
    }

    // خواندن: تعداد کل پیام‌ها
    pub fn get_count(env: Env) -> u32 {
        let messages: Vec<Message> = env
            .storage()
            .instance()
            .get(&DataKey::Messages)
            .unwrap_or(Vec::new(&env));
        messages.len()
    }
}