// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract GameNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    mapping(uint256 => string) public itemTypes;

    event ItemMinted(address indexed to, uint256 indexed tokenId, string itemType);

    /**
     * @dev Sets the name and symbol for the NFT collection and transfers ownership.
     * The call to ERC721() provides the required arguments to the base constructor.
     */
    constructor() ERC721("Echoes of the Village Items", "EVI") Ownable(msg.sender) {
        // We start token IDs from 1, as 0 is often ambiguous
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
        _nextTokenId++;

        _safeMint(_player, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        itemTypes[tokenId] = _itemType;

        emit ItemMinted(_player, tokenId, _itemType);
    }

    /**
     * @dev Allows a player to burn (destroy) an item they own.
     * This is used when trading an item to a villager.
     * @param tokenId The ID of the token to burn.
     */
    function burnItem(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can burn the item");
        _burn(tokenId);
    }
}