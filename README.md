# Echoes of the Village (Sui Blockchain Edition)

Echoes of the Village is an immersive 2D mystery-adventure game that blends a dynamically generated narrative with the power of the Sui blockchain. Each playthrough offers a unique story, challenging players to explore, interact, and trade their way to the truth to save their lost friends.

## The Story

A relaxing trip with friends takes a horrifying turn. A sudden, violent accident plunges you into darkness. You awaken alone, disoriented, on the outskirts of a strange, mist-shrouded village. Your friends are gone.

Your journey begins with a mysterious, disembodied voice guiding you, its words echoing in your mind. This voice, powered by Text-to-Speech (TTS), sets the stage for the mystery that lies ahead. The villagers are wary, their memories fragmented, and their secrets buried deep. You must piece together the puzzle of what happened to your friends and find a way to rescue them before it's too late.

## Gameplay & Features

The core of the game is a race against time to solve a dynamically generated mystery. Every time you start a new game, our backend AI engine crafts a completely new story, ensuring infinite replayability.

### Key Features

- **Dynamic Narrative Engine**: No two playthroughs are the same. Our backend, powered by a Large Language Model (LLM), generates a unique mystery for each game session, including different clues, villager roles, and a secret "ground truth" location where your friends are being held.

- **Voice-Driven Conversations**: Interact with villagers through a rich, voice-powered dialogue system. Villagers' lines are brought to life with Text-to-Speech, and you guide the conversation by choosing from a list of dynamically generated suggestions, also powered by the LLM.

- **Explore and Discover On-Chain Objects**: The village map is scattered with valuable items that exist as on-chain Objects on the Sui network. These aren't just collectibles; they are crucial, ownable assets for your investigation.

- **Trade for Hints**: Some villagers are more forthcoming than others. The "greedy" ones may hold vital information but will only share it in exchange for one of the on-chain Objects you've discovered. This creates a unique in-game economy where you must decide which items to trade to advance the story.

- **The Final Accusation**: After a set amount of time (currently 5 seconds for demo purposes), you will be allowed to make your final guess. Using the clues you've gathered, you must choose the correct location where your friends are trapped.

- **On-Chain Scoring**: Your performance is calculated based on time taken, number of guesses, and Objects collected. This final score is recorded on the Sui blockchain via a Move smart contract, creating a permanent, transparent record of your achievement.

## Core Mechanics Explained

### 1. Dynamic Conversation with LLM and TTS

The dialogue system is the heart of the game's mystery. When a player interacts with a villager, the frontend sends a request to the backend's `/interact` endpoint.

**API Interaction (server/main.py):**
```
@app.post("/game/{game_id}/interact", response_model=ConversationResponse)
async def interact(game_id: str, interaction: InteractionRequest):
# Retrieve the current state of the game
game_state = state_manager.get_game_state(game_id)
if not game_state:
raise HTTPException(status_code=404, detail="Game not found")
# Generate the next part of the conversation using the LLM
response_data = game_engine.process_interaction(game_state, interaction)
```

# (TTS generation would happen here or on the client-side)

return response_data

The backend uses the current game state and the player's chosen suggestion to generate a new, contextually relevant line of dialogue for the villager and a new set of choices for the player. This response is sent back to the game client, and the villager's dialogue is converted to speech using a Text-to-Speech engine, creating an immersive auditory experience.

### 2. On-Chain Assets (Sui Objects)

In-game items like a "Fishing Rod" or "Flowers" are not just part of the game's state; they are tangible assets on the Sui blockchain. The `contract_one` module, written in Move, defines the structure of these objects.

**Move Smart Contract (contract_one/sources/contract_one.move):**
```
// Example of creating an in-game item as a Sui Object
public fun mint_item(name: vector<u8>, description: vector<u8>, ctx: &mut TxContext) {
let item = Item {
id: object::new(ctx),
name: string::utf8(name),
description: string::utf8(description),
};
transfer::public_transfer(item, tx_context::sender(ctx));
}
```

When a player finds an item in the game, a transaction is initiated that calls a function like `mint_item`, creating a new Item object and transferring it directly to the player's wallet.

### 3. Trading Objects for Information

The true utility of the on-chain Objects comes from trading them. When a player possesses an Object that a villager desires, the game logic allows them to offer it in exchange for a crucial hint. This is handled by the backend's narrative engine, which checks the player's inventory (known to the backend) against the villager's needs before generating the special dialogue branch.

### 4. On-Chain Scoring

At the end of the game, a final score is calculated. This score is then permanently recorded on the Sui blockchain using a function in the Move smart contract.

**Move Smart Contract (contract_one/sources/contract_one.move):**
```
// Example of a function to record a player's score
public entry fun update_score(player: address, new_score: u64, ctx: &mut TxContext) {
// Logic to fetch or create a Score object for the player
// and update it if the new score is higher.
// ...
}
```
This ensures that high scores are verifiable and cannot be altered, creating a fair and permanent leaderboard.

## Technology Stack

This project is a full-stack application that combines modern web development, a powerful AI backend, and the high-performance Sui blockchain.

### Frontend (game_onechain)
- **Game Engine**: Phaser 3 - A fast, free, and fun open-source HTML5 game framework.
- **Build Tool**: Vite - For a fast and lean development experience.
- **Language**: JavaScript (ES6+)
- **Web3 Library**: Libraries compatible with the Sui blockchain for wallet and contract interaction.

### Backend (server)
- **Framework**: FastAPI - A modern, high-performance Python web framework for building APIs.
- **Language**: Python
- **AI / Narrative Generation**: Google Gemini - Used to power the dynamic story creation and conversational AI.

### Blockchain (contract_one)
- **Blockchain**: Sui Network - A next-generation Layer 1 blockchain with high throughput and low latency.
- **Language**: Move - A safe and secure programming language for building smart contracts.
- **On-Chain Assets**: Sui Objects - The core asset type on the Sui network, used for in-game items.

## Getting Started

To run this project locally, you will need to set up the three main components: the Sui smart contract, the backend server, and the frontend game.

### Prerequisites
- Node.js and npm
- Python 3.8+ and pip
- Sui CLI (for smart contract development)
- A Sui-compatible wallet (e.g., Sui Wallet)

### 1. Build and Deploy the Sui Contract

First, build and publish your Move contract to a local Sui network.

Navigate to the contract directory
cd contract_one

Build the Move package
sui move build

(Optional) Start a local Sui network if you don't have one
sui start
Publish the contract to your local network
This command will return the deployed package ID and object IDs.
sui client publish --gas-budget 100000000

text

**Note**: You will need to update the frontend with the new Object IDs from the publish command.

### 2. Run the Backend Server

Next, set up and run the FastAPI server which powers the narrative.

Navigate to the server directory
cd ../server

Install dependencies
pip install -r requirements.txt

Run the server
uvicorn main:app --reload

text

### 3. Run the Frontend Game

Finally, run the Phaser game client.

Navigate to the game directory
cd ../game_onechain

Install dependencies
npm install

Start the development server
npm run dev

text

You can now open your browser to `http://localhost:5173` (or the URL displayed in your terminal) to start playing the game!
