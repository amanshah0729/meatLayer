// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentINFT
 * @notice Minimal ERC-721 for MeatLayer AI agents. Ownership = agent control.
 *         Encrypted intelligence stored in 0G Storage; contract holds pointer + hash.
 */
contract AgentINFT is ERC721, Ownable {
    struct AgentData {
        string storagePointer;
        bytes32 blobHash;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => AgentData) public agentData;

    event AgentMinted(uint256 indexed tokenId, address indexed to, string storagePointer);

    constructor() ERC721("MeatLayer Agent", "MLAG") Ownable(msg.sender) {}

    /**
     * @notice Mint a new agent iNFT. Only contract owner (deployer) can mint.
     * @param to Recipient address (agent owner)
     * @param storagePointer 0G Storage CID / pointer to encrypted blob
     * @param blobHash keccak256 hash of encrypted blob for verification
     */
    function mintAgent(
        address to,
        string calldata storagePointer,
        bytes32 blobHash
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        agentData[tokenId] = AgentData({
            storagePointer: storagePointer,
            blobHash: blobHash
        });

        emit AgentMinted(tokenId, to, storagePointer);
    }

    /**
     * @notice Get storage pointer for a token.
     */
    function getStoragePointer(uint256 tokenId) external view returns (string memory) {
        return agentData[tokenId].storagePointer;
    }

    /**
     * @notice Get blob hash for a token.
     */
    function getBlobHash(uint256 tokenId) external view returns (bytes32) {
        return agentData[tokenId].blobHash;
    }
}
