// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/scoreManager.sol";
import "../src/gameNFT.sol";

/**
 * @title GameContractsTest
 * @dev Test suite for ScoreManager and GameNFT contracts.
 */
contract GameContractsTest is Test {
    ScoreManager public scoreManager;
    GameNFT public gameNFT;

    // A demo player account provided by Anvil/Foundry
    address player1 = vm.addr(1); // Address for private key #1 from anvil
    address player2 = vm.addr(2); // Address for private key #2 from anvil

    /**
     * @dev This function is called before each test case.
     * It deploys fresh instances of the contracts for a clean testing state.
     */
    function setUp() public {
        scoreManager = new ScoreManager();
        gameNFT = new GameNFT();
    }

    /*//////////////////////////////////////////////////////////////
                           SCOREMANAGER TESTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Tests if a player's score can be updated correctly.
     */
    function testUpdateAndReadScore() public {
        // We will make player1 call the contract
        // vm.prank simulates a call from a specific address
        vm.prank(player1);
        scoreManager.updateScore(1500);

        uint256 p1Score = scoreManager.readIndividualScore(player1);

        // assertEq checks if two values are equal. If not, the test fails.
        assertEq(p1Score, 1500, "Player 1's score should be 1500");
    }

    /**
     * @dev Tests that the score only updates if the new score is higher.
     */
    function testScoreDoesNotDecrease() public {
        vm.prank(player1);
        scoreManager.updateScore(2000);

        // Try to update with a lower score
        vm.prank(player1);
        scoreManager.updateScore(1800);

        uint256 p1Score = scoreManager.readIndividualScore(player1);
        assertEq(p1Score, 2000, "Score should not decrease from 2000");
    }

    /**
     * @dev Tests the getAllPlayers function.
     */
    function testGetAllPlayers() public {
        vm.prank(player1);
        scoreManager.updateScore(100);

        vm.prank(player2);
        scoreManager.updateScore(200);

        address[] memory players = scoreManager.getAllPlayers();
        assertEq(players.length, 2, "There should be 2 players in the array");
        assertEq(players[0], player1, "First player should be player1");
        assertEq(players[1], player2, "Second player should be player2");
    }

    /*//////////////////////////////////////////////////////////////
                               GAME NFT TESTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Tests minting an NFT. The contract owner (test contract itself) mints to player1.
     */
    function testMintNFT() public {
        // The test contract is the owner, so it can call mintItem
        gameNFT.mintItem(player1, "Fishing Rod", "uri_for_rod.json");

        // Check if player1 is the owner of token ID 1
        assertEq(gameNFT.ownerOf(1), player1, "Player 1 should own the NFT with ID 1");
        // Check the balance of player1
        assertEq(gameNFT.balanceOf(player1), 1, "Player 1's balance should be 1");
    }

    /**
     * @dev Tests that only the owner can mint new NFTs.
     * This test expects the transaction to FAIL.
     */
    function testFailMintFromNonOwner() public {
        // Simulate player1 trying to call the mintItem function
        vm.prank(player1);

        // vm.expectRevert tells the test to expect the next call to fail.
        // If it doesn't fail, the test itself fails!
        vm.expectRevert();
        gameNFT.mintItem(player2, "Illegal Flowers", "uri.json");
    }
}