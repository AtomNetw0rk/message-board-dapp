# 📝 On-Chain Message Board

A decentralized message board built on the **Stellar** blockchain. Connect your wallet, post a message, and it lives forever on-chain. Anyone can read every message directly from the smart contract.

Built for the **Stellar Journey to Mastery** program — 🟡 Yellow Belt submission.

🔗 **Live contract:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDPOXHURLFAMTGZY3NJ2ITJ3VDU6WB26RGB4KLQNXHSQHEFJZWHEFMUH)

---

## ✨ Features

- 🔗 **Multi-wallet support** via Stellar Wallets Kit (Freighter, xBull, Albedo, and more)
- ✍️ **Write to the contract** — post a message with the `add_message` function
- 📖 **Read from the contract** — all messages are fetched with `get_messages`
- ⏳ **Live transaction status** — pending / success / failed
- 🛡️ **Error handling** — wallet not found, user rejection, and empty/invalid input
- 🔄 **Auto-refresh** — the message list updates automatically after a successful post

---

## 🏗️ Architecture

​
React + Vite frontend
│  read  (simulate, no fee)   ──►  get_messages / get_count
│  write (sign + send tx)     ──►  add_message (require_auth)
▼
@stellar/stellar-sdk (Soroban RPC)
▼
MessageBoard smart contract (Rust / Soroban)
▼
On-chain instance storage (Vec<Message>)

- **Reading** uses a read-only simulation against the Soroban RPC — no wallet or fee required.
- **Writing** builds an `add_message` transaction, the connected wallet signs it, and it is submitted to the network. The UI polls until the transaction succeeds, then refreshes the list.

---

## 📇 Contract API

| Function | Type | Description |
| --- | --- | --- |
| `add_message(author, text)` | write | Stores a new message on-chain. Requires the author's authorization. Returns the new message count. |
| `get_messages()` | read | Returns the full list of messages (`author` + `text`). |
| `get_count()` | read | Returns the total number of messages. |

---

## 🗂️ Project Structure

​
message-board-dapp/
├── contracts/
│   └── message-board/     # Soroban smart contract (Rust)
│       └── src/lib.rs      # Contract logic
├── src/                    # React frontend
├── Cargo.toml              # Rust workspace
├── package.json            # Frontend dependencies
└── README.md

---

## 🛠️ Tech Stack

- React + Vite
- @stellar/stellar-sdk (Soroban RPC)
- @creit.tech/stellar-wallets-kit
- Soroban smart contract (Rust)

---

## 📜 Deployed Contract (Testnet)

- **Contract address:** `CDPOXHURLFAMTGZY3NJ2ITJ3VDU6WB26RGB4KLQNXHSQHEFJZWHEFMUH`
- **Explorer:** [View contract](https://stellar.expert/explorer/testnet/contract/CDPOXHURLFAMTGZY3NJ2ITJ3VDU6WB26RGB4KLQNXHSQHEFJZWHEFMUH)

### Example transaction

- **Transaction hash:** `ec54db859c4e64d3016fb659284d049d796b97cd74160bdede003d3dee2e7501`
- **Explorer:** [View transaction](https://stellar.expert/explorer/testnet/tx/ec54db859c4e64d3016fb659284d049d796b97cd74160bdede003d3dee2e7501)

---

## 🖼️ Screenshots

### Wallet options

![Wallet options](./screenshots/wallets.png)

---

## 🚀 Getting Started

### Frontend

​
git clone https://github.com/AtomNetw0rk/message-board-dapp.git
cd message-board-dapp
npm install
npm run dev

Open http://localhost:5173 in your browser. You need a Stellar wallet (such as Freighter) set to **Testnet** with a funded account.

### Smart contract

​
stellar contract build
cargo test

---

## 📄 License

MIT — see [LICENSE](./LICENSE).