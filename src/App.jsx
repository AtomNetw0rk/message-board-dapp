import { useState, useEffect } from "react";
import {
  StellarWalletsKit,
  allowAllModules,
} from "@creit.tech/stellar-wallets-kit";
import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  Account,
  Keypair,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import "./App.css";

const RPC_URL = "https://soroban-testnet.stellar.org";
const CONTRACT_ID = "CDPOXHURLFAMTGZY3NJ2ITJ3VDU6WB26RGB4KLQNXHSQHEFJZWHEFMUH";
const EXPLORER = "https://stellar.expert/explorer/testnet/tx/";

const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

const kit = new StellarWalletsKit({
  network: Networks.TESTNET,
  selectedWalletId: "freighter",
  modules: allowAllModules(),
});

function shorten(addr) {
  if (!addr) return "";
  return addr.slice(0, 4) + "..." + addr.slice(-4);
}

function App() {
  const [address, setAddress] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | pending | success | error
  const [statusMsg, setStatusMsg] = useState("");
  const [txHash, setTxHash] = useState("");

  // خواندن پیام‌ها از قرارداد (نیازی به کیف پول نداره)
  const loadMessages = async () => {
    try {
      const reader = new Account(Keypair.random().publicKey(), "0");
      const tx = new TransactionBuilder(reader, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call("get_messages"))
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        setMessages(scValToNative(sim.result.retval));
      }
    } catch (e) {
      console.log("Load messages error:", e);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // اتصال چند کیف پول
  const connectWallet = async () => {
    setStatus("idle");
    setStatusMsg("");
    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id);
            const result = await kit.getAddress();
            setAddress(result.address);
          } catch (e) {
            setStatus("error");
            setStatusMsg("Could not read the wallet address.");
          }
        },
      });
    } catch (e) {
      setStatus("error");
      setStatusMsg("No wallet found. Please install a Stellar wallet like Freighter.");
    }
  };

  const disconnectWallet = async () => {
    try {
      await kit.disconnect();
    } catch (e) {
      // ignore
    }
    setAddress("");
    setStatus("idle");
    setStatusMsg("");
    setTxHash("");
  };

  // نوشتن پیام روی قرارداد
  const postMessage = async () => {
    setTxHash("");
    if (!text.trim()) {
      setStatus("error");
      setStatusMsg("Please write a message first.");
      return;
    }
    setStatus("pending");
    setStatusMsg("Sending your message to the blockchain...");
    try {
      const account = await server.getAccount(address);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            "add_message",
            Address.fromString(address).toScVal(),
            nativeToScVal(text, { type: "string" })
          )
        )
        .setTimeout(30)
        .build();

      const prepared = await server.prepareTransaction(tx);

      const signed = await kit.signTransaction(prepared.toXDR(), {
  address: address,
  networkPassphrase: Networks.TESTNET,
});

      const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.TESTNET);
      const sent = await server.sendTransaction(signedTx);

      let result = await server.getTransaction(sent.hash);
      while (result.status === "NOT_FOUND") {
        await new Promise((r) => setTimeout(r, 1500));
        result = await server.getTransaction(sent.hash);
      }

      if (result.status === "SUCCESS") {
        setStatus("success");
        setStatusMsg("Your message is now on-chain!");
        setTxHash(sent.hash);
        setText("");
        await loadMessages();
      } else {
        setStatus("error");
        setStatusMsg("Transaction failed on the network.");
      }
    } catch (e) {
      const msg = (e && e.message ? e.message : String(e)).toLowerCase();
      if (msg.includes("reject") || msg.includes("denied") || msg.includes("declined")) {
        setStatus("error");
        setStatusMsg("You rejected the transaction in your wallet.");
      } else if (msg.includes("insufficient") || msg.includes("underfunded") || msg.includes("balance")) {
        setStatus("error");
        setStatusMsg("Insufficient balance to pay the network fee. Please fund your wallet.");
      } else {
        setStatus("error");
        setStatusMsg(e && e.message ? e.message : "Something went wrong.");
      }
      console.log("Post error:", e);
    }
  };

  return (
    <div className="app">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <div className="card">
        <div className="logo">📝</div>
        <h1 className="title">On-Chain Message Board</h1>
        <p className="subtitle">Write a message that lives forever on Stellar</p>

        {!address && (
          <button className="btn btn-primary" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {address && (
          <div className="wallet-box">
            <div className="row">
              <span className="badge">● {shorten(address)}</span>
              <button className="btn-link" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          </div>
        )}

        {address && (
          <div className="form">
            <label className="label">Your message</label>
            <textarea
              className="input textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Say something..."
              rows={3}
            />
            <button
              className="btn btn-primary btn-block"
              onClick={postMessage}
              disabled={status === "pending"}
            >
              {status === "pending" ? (
                <>
                  <span className="spinner"></span>Sending...
                </>
              ) : (
                "Post Message"
              )}
            </button>
          </div>
        )}

        {status === "pending" && <div className="alert alert-pending">⏳ {statusMsg}</div>}
        {status === "success" && (
          <div className="alert alert-success">
            <b>✅ {statusMsg}</b>
            {txHash && (
              <a className="tx-link" href={EXPLORER + txHash} target="_blank" rel="noreferrer">
                View transaction ↗
              </a>
            )}
          </div>
        )}
        {status === "error" && <div className="alert alert-error">❌ {statusMsg}</div>}

        <div className="messages">
          <div className="messages-head">
            <span>Messages ({messages.length})</span>
            <button className="btn-link" onClick={loadMessages}>
              ↻ Refresh
            </button>
          </div>
          {messages.length === 0 && <p className="empty">No messages yet. Be the first!</p>}
          {messages
            .slice()
            .reverse()
            .map((m, i) => (
              <div className="message" key={i}>
                <div className="message-text">{m.text}</div>
                <div className="message-author">{shorten(m.author)}</div>
              </div>
            ))}
        </div>

        <div className="footer">Powered by Stellar · Soroban · Testnet</div>
      </div>
    </div>
  );
}

export default App;