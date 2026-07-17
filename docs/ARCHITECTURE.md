works end to end.

## Overview

The project has two parts:

1. **Smart contract** (`contracts/message-board`) — a Soroban contract written in Rust that stores messages on the Stellar network.
2. **Frontend** (`src/`) — a React + Vite single-page app that reads from and writes to the contract.

## Data flow

​
User ── types a message ──► React UI
│ 1. build add_message transaction
▼
@stellar/stellar-sdk
│ 2. wallet signs (Stellar Wallets Kit)
▼
Soroban RPC (Testnet)
│ 3. submit + confirm
▼
MessageBoard contract
▼
instance storage: Vec<Message>

For reads (`get_messages`, `get_count`) the app runs a read-only simulation, so no wallet signature or fee is needed.

## Contract storage model

The contract keeps a single key in instance storage:

- `DataKey::Messages` → `Vec<Message>`, where each `Message` holds the `author` address and the `text`.

Posting a message (`add_message`) calls `author.require_auth()`, so only the real signer can post under their own address.

## Why Stellar / Soroban?

- Low fees and fast (~5s) finality make posting messages cheap and quick.
- `require_auth` provides built-in, verifiable authentication with no custom signature code.
- Soroban's typed storage makes it simple to persist structured data on-chain.