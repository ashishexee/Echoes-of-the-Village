// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract ScoreManager {
    mapping(address => uint256) public playerScores;
    address[] public players;

    // Event to announce a score update
    event ScoreUpdated(address indexed player, uint256 newScore);

    function updateScore(uint256 _newScore) public {
        address player = msg.sender;

        if (playerScores[player] == 0) {
            players.push(player);
        }

        if (_newScore > playerScores[player]) {
            playerScores[player] = _newScore;
            emit ScoreUpdated(player, _newScore);
        }
    }
    function readIndividualScore(address _player) public view returns (uint256) {
        return playerScores[_player];
    }
    function getAllPlayers() public view returns (address[] memory) {
        return players;
    }
}