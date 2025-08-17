// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/scoreManager.sol";
import "../src/gameNFT.sol";

contract DeployContracts is Script {
    function run() external returns (ScoreManager, GameNFT) {
        // This command tells Foundry to start broadcasting transactions
        // to the specified network (Anvil, in our case).
        vm.startBroadcast();

        // Deploy the contracts, one after the other.
        ScoreManager scoreManager = new ScoreManager();
        GameNFT gameNFT = new GameNFT();

        // Stop broadcasting transactions.
        vm.stopBroadcast();

        // Return the deployed contract instances.
        return (scoreManager, gameNFT);
    }
}