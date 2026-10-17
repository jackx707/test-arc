// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AgentRegistry is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI);
    event AgentURIUpdated(uint256 indexed agentId, string newURI);

    constructor(address initialOwner) ERC721("AgentRegistry", "AGENT") Ownable(initialOwner) {}

    function register(string calldata agentURI_) external returns (uint256 agentId) {
        agentId = _nextTokenId;
        _nextTokenId = agentId + 1;

        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI_);

        emit AgentRegistered(agentId, msg.sender, agentURI_);
    }

    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender, "AgentRegistry: caller is not the agent owner");

        _setTokenURI(agentId, newURI);
        emit AgentURIUpdated(agentId, newURI);
    }

    function agentURI(uint256 agentId) external view returns (string memory) {
        return tokenURI(agentId);
    }

    function totalAgents() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
