
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title GameNFT
 * @dev Manages the in-game item NFTs using a manual token ID counter.
 */
contract GameNFT is ERC721URIStorage, Ownable {
    // A state variable to keep track of the next token ID to be minted.
    uint256 private _nextTokenId;

    // Mapping from tokenId to item type (e.g., "Fishing Rod")
    mapping(uint256 => string) public itemTypes;

    event ItemMinted(address indexed to, uint256 indexed tokenId, string itemType);

    /**
     * @dev Sets the name and symbol for the NFT collection.
     */
    constructor() ERC721("Echoes of the Village Items", "EVI") {
        // We start token IDs from 1, as 0 can be ambiguous.
        _nextTokenId = 1;
    }

    /**
     * @dev Allows the game owner to mint a new item NFT for a player.
     * @param _player The address of the player who will receive the NFT.
     * @param _itemType A string describing the item (e.g., "Fishing Rod", "Flowers").
     * @param _tokenURI A URL pointing to the NFT's metadata (image, attributes).
     */
    function mintItem(address _player, string memory _itemType, string memory _tokenURI) public onlyOwner {
        uint256 tokenId = _nextTokenId;
        // Increment the counter for the next minting operation.
        _nextTokenId++;

        _safeMint(_player, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        itemTypes[tokenId] = _itemType;

        emit ItemMinted(_player, tokenId, _itemType);
    }
}
