const express = require("express");
const { ethers } = require("ethers");
const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");
require('dotenv').config(); // Make sure to use dotenv to load your .env file

// --- CONFIGURATION ---
const PORT = 3001;
const PRIVATE_KEY = process.env.OG_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error("CRITICAL: OG_PRIVATE_KEY environment variable is not set!");
}

const RPC_URL = "https://evmrpc-testnet.0g.ai";
const LLAMA_PROVIDER_ADDRESS = "0xf07240Efa67755B5311bc75784a061eDB47165Dd";
const MINIMUM_DEPOSIT_AMOUNT = "0.01"; // The amount to deposit to initialize the ledger

const app = express();
app.use(express.json());

let broker;

// --- API ENDPOINT ---
app.post("/generate-narrative", async (req, res) => {
  if (!broker) {
    return res.status(503).json({ error: "Broker is not initialized yet. Please wait." });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is a required field." });
    }

    console.log("Received prompt. Generating 0G request headers...");

    const headers = await broker.inference.getRequestHeaders(LLAMA_PROVIDER_ADDRESS, prompt);

    const { endpoint, model } = await broker.inference.getServiceMetadata(LLAMA_PROVIDER_ADDRESS);

    console.log(`Sending request to provider at ${endpoint}...`);

    const providerResponse = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: model,
      }),
    });

    if (!providerResponse.ok) {
        throw new Error(`Provider returned an error: ${providerResponse.statusText}`);
    }

    const data = await providerResponse.json();
    const answer = data.choices[0].message.content;

    console.log("Processing and verifying response on-chain...");
    await broker.inference.processResponse(LLAMA_PROVIDER_ADDRESS, answer, data.id);

    console.log("Successfully received and verified the narrative from 0G.");
    res.json({ narrative: answer });

  } catch (error) {
    console.error("Error processing 0G compute request:", error);
    res.status(500).json({ error: "Failed to generate narrative via 0G Compute." });
  }
});

// --- SERVER INITIALIZATION (UPDATED LOGIC) ---
const startServer = async () => {
  console.log("Initializing 0G Compute Broker...");
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    broker = await createZGComputeNetworkBroker(wallet);
    console.log(`✅ Broker initialized successfully with wallet address: ${wallet.address}`);

    // --- NEW: Check and Initialize Ledger ---
    console.log("Checking 0G Compute Ledger status...");
    
    // First, let's see if a ledger even exists by trying to read it.
    let computeLedger;
    try {
      computeLedger = await broker.ledger.getLedger();
    } catch (error) {
        // We expect this to fail if the ledger doesn't exist.
        if (error.code === 'BAD_DATA') {
            console.log("ℹ️ No existing compute ledger found for this wallet. Attempting to create one...");
            computeLedger = null;
        } else {
            // If it's a different error, we should stop.
            throw error;
        }
    }

    if (!computeLedger || ethers.parseEther(computeLedger.totalBalance.toString()) === 0n) {
        console.log("Ledger is empty or non-existent. A one-time deposit is required.");
        
        // Check if the wallet has enough OG to make the initial deposit.
        const walletBalance = await provider.getBalance(wallet.address);
        const requiredBalance = ethers.parseEther(MINIMUM_DEPOSIT_AMOUNT);

        console.log(`Wallet Balance: ${ethers.formatEther(walletBalance)} OG`);
        console.log(`Required Deposit: ${MINIMUM_DEPOSIT_AMOUNT} OG`);

        if (walletBalance < requiredBalance) {
            console.error(`❌ FATAL: Insufficient wallet balance. You need at least ${MINIMUM_DEPOSIT_AMOUNT} OG to initialize the compute ledger.`);
            console.error(`Please get tokens from the 0G Discord faucet and send them to ${wallet.address}`);
            process.exit(1);
        }

        console.log("Depositing funds to create the on-chain compute ledger...");
        const tx = await broker.ledger.addLedger(MINIMUM_DEPOSIT_AMOUNT);
        await tx.wait(); // Wait for the transaction to be mined
        console.log("✅ Successfully deposited and created ledger!");
    }

    const finalLedger = await broker.ledger.getLedger();
    console.log(`💰 Current 0G Compute balance: ${ethers.formatEther(finalLedger.balance)} OG`);
    
    // --- Acknowledge Provider (same as before) ---
    try {
        console.log(`Acknowledging provider ${LLAMA_PROVIDER_ADDRESS}...`);
        await broker.inference.acknowledgeProviderSigner(LLAMA_PROVIDER_ADDRESS);
        console.log("✅ Provider acknowledged successfully.");
    } catch (e) {
        if (e.message && e.message.includes("already exists")) {
            console.log("ℹ️ Provider was already acknowledged.");
        } else {
            throw e;
        }
    }

    app.listen(PORT, () => {
      console.log(`🚀 0G Compute Bridge is running and listening on http://localhost:${PORT}`);
    });
  } catch (error) {
      console.error("❌ FATAL: Could not complete bridge server startup.", error);
      process.exit(1);
  }
};

startServer();
