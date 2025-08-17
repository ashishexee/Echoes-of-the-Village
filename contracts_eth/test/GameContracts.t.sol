// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/scoreManager.sol";
import "../src/gameNFT.sol";
// Import the Ownable contract to access its custom error definition
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract GameContractsTest is Test {
    ScoreManager public scoreManager;
    GameNFT public gameNFT;

    address player1 = vm.addr(1);
    address player2 = vm.addr(2);

    function setUp() public {
        scoreManager = new ScoreManager();
        gameNFT = new GameNFT();
    }

    function testUpdateAndReadScore() public {
        vm.prank(player1);
        scoreManager.updateScore(1500);
        assertEq(scoreManager.readIndividualScore(player1), 1500);
    }

    function testScoreDoesNotDecrease() public {
        vm.prank(player1);
        scoreManager.updateScore(2000);

        vm.prank(player1);
        scoreManager.updateScore(1800);

        assertEq(scoreManager.readIndividualScore(player1), 2000);
    }
    
    function testMintNFT() public {
        gameNFT.mintItem(player1, "Fishing Rod", "uri_for_rod.json");
        assertEq(gameNFT.ownerOf(1), player1);
        assertEq(gameNFT.balanceOf(player1), 1);
    }

    /**
     * @dev Tests that only the owner can mint new NFTs.
     * This test now expects the full custom error with the caller's address.
     */
    function test_Revert_If_NonOwner_Mints() public {
        vm.prank(player1);

        // CORRECTED LINE:
        // We build the full error message, including the selector and the address of the caller (player1).
        bytes memory expectedError = abi.encodeWithSelector(
            Ownable.OwnableUnauthorizedAccount.selector,
            player1
        );
        vm.expectRevert(expectedError);
        
        // This line is expected to fail with the exact error we just built.
        gameNFT.mintItem(player2, "Illegal Flowers", "uri.json");
    }
}