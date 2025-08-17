
import { ethers } from 'ethers';
import { scoreManagerABI } from './ABI/ScoreManagerABI';
import { gameNFTABI } from './ABI/GameNFTABI';

const scoreManagerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const gameNFTAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

let provider;
let signer;
let scoreManagerContract;
let gameNFTContract;
let connectedAddress = null;

/**
 * Connects the game to the user's MetaMask wallet and initializes contracts.
 * @returns {Promise<string|null>} The connected wallet address or null if it fails.
 */
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // A Web3Provider wraps a standard Web3 provider, which is
            // what MetaMask injects as window.ethereum into each page
            provider = new ethers.BrowserProvider(window.ethereum);

            // MetaMask requires requesting permission to connect users accounts
            await provider.send("eth_requestAccounts", []);
            
            // The signer is the user's account that can sign transactions.
            signer = await provider.getSigner();
            connectedAddress = await signer.getAddress();

            // Create instances of your contracts that are connected to the signer.
            scoreManagerContract = new ethers.Contract(scoreManagerAddress, scoreManagerABI, signer);
            gameNFTContract = new ethers.Contract(gameNFTAddress, gameNFTABI, signer);

            console.log("Wallet Connected:", connectedAddress);
            return connectedAddress;
        } catch (error) {
            console.error("User denied account access or error occurred:", error);
            alert("Wallet connection failed. Please try again.");
            return null;
        }
    } else {
        alert("Please install MetaMask to use the blockchain features!");
        return null;
    }
}

/**
 * Updates the player's score on the blockchain.
 * @param {number} score The new score to submit.
 */
async function updatePlayerScore(score) {
    if (!scoreManagerContract) {
        alert("Please connect your wallet first.");
        return;
    }
    try {
        console.log(`Submitting score: ${score}...`);
        const tx = await scoreManagerContract.updateScore(score);
        await tx.wait(); // Wait for the transaction to be confirmed on the blockchain
        console.log("Score updated successfully! Transaction hash:", tx.hash);
        alert("Your score has been saved on the blockchain!");
    } catch (error) {
        console.error("Failed to submit score:", error);
        alert("There was an error submitting your score.");
    }
}

/**
 * Mints a new NFT item for the connected player.
 * @param {string} itemType The type of item (e.g., "Fishing Rod").
 * @param {string} metadataURI The URL to the item's metadata.
 */
async function mintGameItem(itemType, metadataURI) {
    if (!gameNFTContract || !connectedAddress) {
        alert("Please connect your wallet first.");
        return;
    }
    
    // SECURITY NOTE: In a real production game, a secure backend server should
    // call this function. For this demo, we allow the player to mint directly,
    // but this assumes the player is also the contract owner.
    try {
        console.log(`Minting ${itemType}...`);
        const tx = await gameNFTContract.mintItem(connectedAddress, itemType, metadataURI);
        await tx.wait();
        console.log(`${itemType} NFT minted! Transaction hash:`, tx.hash);
        alert(`You've collected a ${itemType}! It's now an NFT in your wallet.`);
    } catch (error) {
        console.error("Failed to mint item:", error);
        alert("Minting failed. Only the contract deployer can mint NFTs in this demo.");
    }
}

// Export the functions and state so your game scenes can use them
export { 
    connectWallet, 
    updatePlayerScore, 
    mintGameItem,
    connectedAddress 
};